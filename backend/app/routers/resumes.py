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
    extract_resume_data, improve_resume, generate_cover_letter
)
import logging
import uuid
import io

logger = logging.getLogger(__name__)
router = APIRouter()


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
        # Get student profile
        profile = supabase.table("student_profiles") \
            .select("id").eq("user_id", str(current_user.id)).single().execute()
        if not profile.data:
            raise HTTPException(status_code=404, detail="Create your profile before uploading a resume")

        student_id = profile.data["id"]

        # Extract text from PDF
        parsed_text = parse_resume_pdf(content, file.filename)

        # Create resume record
        resume_data = {
            "student_id": student_id,
            "original_filename": file.filename,
            "file_data": content.hex(),  # Store as hex; use Supabase Storage in production
            "file_mimetype": file.content_type,
            "parsed_text": parsed_text,
            "status": "parsed",
        }

        result = supabase.table("resumes").insert(resume_data).execute()
        resume_id = result.data[0]["id"]

        # Async: extract structured data with Gemini (stub returns empty if no API key)
        extracted = await extract_resume_data(parsed_text)

        # Update with extracted data
        supabase.table("resumes").update({
            "extracted_data": extracted,
            "status": "parsed"
        }).eq("id", resume_id).execute()

        return {
            "resume_id": resume_id,
            "filename": file.filename,
            "parsed_text_length": len(parsed_text),
            "extracted_data": extracted,
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
            .select("id").eq("user_id", str(current_user.id)).single().execute()
        if not profile.data:
            return []
        result = supabase.table("resumes") \
            .select("id,original_filename,status,created_at,completion_percentage") \
            .eq("student_id", profile.data["id"]) \
            .order("created_at", desc=True) \
            .execute()
        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch resumes")


@router.get("/{resume_id}/ats-score")
async def get_ats_score(resume_id: uuid.UUID, job_id: uuid.UUID = None, current_user=Depends(get_current_user)):
    """
    Calculate ATS score for a resume.
    If job_id provided, scores against specific job requirements.
    """
    supabase = get_supabase()
    try:
        resume = supabase.table("resumes").select("*").eq("id", str(resume_id)).single().execute()
        if not resume.data:
            raise HTTPException(status_code=404, detail="Resume not found")

        job_requirements = None
        if job_id:
            job = supabase.table("jobs").select("*").eq("id", str(job_id)).single().execute()
            job_requirements = job.data

        score_result = calculate_ats_score(resume.data.get("parsed_text", ""), job_requirements)
        return score_result

    except HTTPException:
        raise
    except Exception as e:
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
        raise HTTPException(status_code=500, detail="Failed to generate improvements")


@router.post("/cover-letter")
async def generate_cover_letter_endpoint(
    resume_id: uuid.UUID,
    job_id: uuid.UUID,
    current_user=Depends(get_current_user)
):
    """Generate AI cover letter from resume + job description"""
    supabase = get_supabase()
    try:
        resume = supabase.table("resumes").select("*").eq("id", str(resume_id)).single().execute()
        job = supabase.table("jobs").select("*").eq("id", str(job_id)).single().execute()

        if not resume.data or not job.data:
            raise HTTPException(status_code=404, detail="Resume or job not found")

        cover_letter = await generate_cover_letter(
            resume_text=resume.data.get("parsed_text", ""),
            job=job.data
        )
        return {"cover_letter": cover_letter}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate cover letter")
