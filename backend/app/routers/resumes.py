"""
Resumes router
Endpoints: upload resume, parse PDF, get AI improvement, ATS score
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, status
from fastapi.responses import StreamingResponse
from app.middleware.auth import get_current_user
from app.database import get_supabase
from app.services.resume_service import parse_resume_pdf, calculate_ats_score
from app.services.gemini_service import (
    improve_resume, generate_cover_letter
)
from ml.resume_parser import ResumeParserML
import logging
import uuid
import io

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize local ML parser (loads spaCy model once)
try:
    ml_parser = ResumeParserML()
except Exception as e:
    logger.warning(f"Could not initialize ResumeParserML: {e}")
    ml_parser = None


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    """
    Upload a resume PDF.
    Triggers: text extraction → Gemini parsing → profile auto-fill suggestions
    """
    if not file.filename.lower().endswith(('.pdf', '.doc', '.docx')):
        raise HTTPException(status_code=400, detail="Only PDF, DOC, DOCX files are accepted")

    MAX_SIZE = 10 * 1024 * 1024  # 10MB
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File size exceeds 10MB limit")

    supabase = get_supabase()
    try:
        student_id = str(uuid.uuid4())
        try:
            profile = supabase.table("student_profiles") \
                .select("id").eq("user_id", str(current_user.id)).execute()
            if profile.data and len(profile.data) > 0:
                student_id = profile.data[0]["id"]
        except Exception as pe:
            logger.warning(f"Could not query student profile, using fallback ID: {pe}")

        # Extract text from PDF
        parsed_text = parse_resume_pdf(content, file.filename)

        # Extract structured data using local ML parser (spaCy)
        extracted = ml_parser.extract_entities(parsed_text)

        resume_id = str(uuid.uuid4())

        # Attempt database insert (fails gracefully if DB not connected)
        try:
            resume_data = {
                "student_id": student_id,
                "original_filename": file.filename,
                "file_data": content.hex(),
                "file_mimetype": file.content_type,
                "parsed_text": parsed_text,
                "extracted_data": extracted,
                "status": "parsed",
            }
            result = supabase.table("resumes").insert(resume_data).execute()
            if result.data and len(result.data) > 0:
                resume_id = result.data[0]["id"]
        except Exception as dbe:
            logger.warning(f"Could not save resume to DB, returning ML parsed result directly: {dbe}")

        # Calculate ATS score immediately
        ats_score_data = calculate_ats_score(parsed_text)

        return {
            "resume_id": resume_id,
            "filename": file.filename,
            "parsed_text_length": len(parsed_text),
            "extracted_data": extracted,
            "ats_score": ats_score_data,
            "message": "Resume uploaded and parsed successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resume upload error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process resume")


@router.get("/")
async def list_resumes(current_user=Depends(get_current_user)):
    """List all resumes for current student"""
    supabase = get_supabase()
    try:
        profile = supabase.table("student_profiles") \
            .select("id").eq("user_id", str(current_user.id)).limit(1).execute()
        if not profile.data:
            return []
        student_id = profile.data[0]["id"]
        try:
            result = supabase.table("resumes") \
                .select("id,original_filename,status,created_at,extracted_data") \
                .eq("student_id", student_id) \
                .order("created_at", desc=True) \
                .execute()
            return result.data or []
        except Exception:
            result = supabase.table("resumes") \
                .select("*") \
                .eq("student_id", student_id) \
                .execute()
            return result.data or []
    except Exception as e:
        logger.error(f"Failed to fetch resumes: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch resumes")


@router.get("/{resume_id}/ats-score")
async def get_ats_score(resume_id: uuid.UUID, job_id: uuid.UUID = None, current_user=Depends(get_current_user)):
    """
    Calculate ATS score for a resume.
    If job_id provided, scores against specific job or placement drive requirements.
    """
    supabase = get_supabase()
    try:
        resume = supabase.table("resumes").select("*").eq("id", str(resume_id)).single().execute()
        if not resume.data:
            raise HTTPException(status_code=404, detail="Resume not found")

        job_requirements = None
        if job_id:
            job_res = supabase.table("jobs").select("*").eq("id", str(job_id)).limit(1).execute()
            if job_res.data and len(job_res.data) > 0:
                job_requirements = job_res.data[0]
            else:
                drive_res = supabase.table("placement_drives").select("*").eq("id", str(job_id)).limit(1).execute()
                if drive_res.data and len(drive_res.data) > 0:
                    d = drive_res.data[0]
                    eligibility = d.get("eligibility") or d.get("eligibility_criteria") or {}
                    skills = eligibility.get("required_skills") or eligibility.get("eligible_branches") or []
                    job_requirements = {
                        "title": d.get("role") or d.get("title") or "Role",
                        "company": d.get("company_name") or "Company",
                        "skills_required": skills if isinstance(skills, list) else [str(skills)],
                        "description": d.get("description", ""),
                    }

        score_result = calculate_ats_score(resume.data.get("parsed_text", ""), job_requirements)
        return score_result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ATS scoring error: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate ATS score")


@router.post("/{resume_id}/improve")
async def improve_resume_endpoint(resume_id: uuid.UUID, current_user=Depends(get_current_user)):
    """
    AI-powered resume improvement suggestions using Gemini.
    Returns: ATS score, missing keywords, weak descriptions, improvement tips.
    """
    supabase = get_supabase()
    try:
        resume = supabase.table("resumes").select("*").eq("id", str(resume_id)).single().execute()
        if not resume.data:
            raise HTTPException(status_code=404, detail="Resume not found")

        suggestions = await improve_resume(resume.data.get("parsed_text", ""))
        return suggestions

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resume improve error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate improvements")


@router.post("/cover-letter")
async def generate_cover_letter_endpoint(
    resume_id: uuid.UUID,
    job_id: uuid.UUID,
    current_user=Depends(get_current_user)
):
    """Generate AI cover letter from resume + job or placement drive description"""
    supabase = get_supabase()
    try:
        resume = supabase.table("resumes").select("*").eq("id", str(resume_id)).single().execute()
        if not resume.data:
            raise HTTPException(status_code=404, detail="Resume not found")

        job_data = None
        job_res = supabase.table("jobs").select("*").eq("id", str(job_id)).limit(1).execute()
        if job_res.data and len(job_res.data) > 0:
            job_data = job_res.data[0]
        else:
            drive_res = supabase.table("placement_drives").select("*").eq("id", str(job_id)).limit(1).execute()
            if drive_res.data and len(drive_res.data) > 0:
                d = drive_res.data[0]
                eligibility = d.get("eligibility") or d.get("eligibility_criteria") or {}
                skills = eligibility.get("required_skills") or eligibility.get("eligible_branches") or []
                job_data = {
                    "title": d.get("role") or d.get("title") or "Software Engineer",
                    "company": d.get("company_name") or "Company",
                    "skills_required": skills if isinstance(skills, list) else [str(skills)],
                    "description": d.get("description", ""),
                }

        if not job_data:
            raise HTTPException(status_code=404, detail="Job or placement drive not found")

        cover_letter = await generate_cover_letter(
            resume_text=resume.data.get("parsed_text", ""),
            job=job_data
        )
        return {"cover_letter": cover_letter}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cover letter generation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate cover letter")
