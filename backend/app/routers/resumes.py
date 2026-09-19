"""
Resumes router
Endpoints: upload resume, parse PDF, get AI improvement, ATS score, sync to profile
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, status
from fastapi.responses import StreamingResponse
from app.middleware.auth import require_student
from app.database import get_supabase
from app.services.resume_service import parse_resume_pdf, calculate_ats_score
from app.services.gemini_service import (
    improve_resume, generate_cover_letter, extract_resume_data as gemini_extract_resume
)
from app.services.scoring_service import calculate_profile_completion
from ml.resume_parser import ResumeParserML
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging
import uuid
import io
import json

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_owned_resume(supabase, resume_id, user_id):
    """Return a resume only when it belongs to the authenticated student."""
    profile = supabase.table("student_profiles").select("id") \
        .eq("user_id", str(user_id)).limit(1).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Student profile not found")
    resume = supabase.table("resumes").select("*") \
        .eq("id", str(resume_id)) \
        .eq("student_id", profile.data[0]["id"]) \
        .limit(1).execute()
    if not resume.data:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume.data[0]


class SyncProfileRequest(BaseModel):
    extracted_data: Optional[Dict[str, Any]] = None


# Initialize local ML parser (loads spaCy model once)
try:
    ml_parser = ResumeParserML()
except Exception as e:
    logger.warning(f"Could not initialize ResumeParserML: {e}")
    ml_parser = None


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user=Depends(require_student)
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
        # Ensure student_id points to a valid student_profiles row
        student_id = None
        try:
            profile = supabase.table("student_profiles") \
                .select("id").eq("user_id", str(current_user.id)).limit(1).execute()
            if profile.data and len(profile.data) > 0:
                student_id = profile.data[0]["id"]
            else:
                user_email = getattr(current_user, "email", "") or ""
                user_name = getattr(current_user, "full_name", "") or "Student"
                new_prof = supabase.table("student_profiles").insert({
                    "user_id": str(current_user.id),
                    "full_name": user_name,
                    "email": user_email,
                    "profile_completion": 0,
                }).execute()
                if new_prof.data and len(new_prof.data) > 0:
                    student_id = new_prof.data[0]["id"]
        except Exception as pe:
            logger.warning(f"Could not query/create student profile: {pe}")

        # Extract text from PDF
        parsed_text = parse_resume_pdf(content, file.filename)

        # Layer 1: Fast regex + spaCy extraction (contact info, skills)
        ml_extracted = ml_parser.extract_entities(parsed_text) if ml_parser else {}

        # Layer 2: Gemini deep extraction (education details, experience, projects, location)
        # Called directly here since we're in an async FastAPI context
        try:
            gemini_extracted = await gemini_extract_resume(parsed_text)
        except Exception as ge:
            logger.warning(f"Gemini extraction failed, using ML-only result: {ge}")
            gemini_extracted = {}

        # Merge: regex wins for contact info, Gemini wins for structured sections
        extracted = {
            "name": ml_extracted.get("name") or gemini_extracted.get("name", ""),
            "email": ml_extracted.get("email") or gemini_extracted.get("email", ""),
            "phone": ml_extracted.get("phone") or gemini_extracted.get("phone", ""),
            "location": gemini_extracted.get("location", "") or ml_extracted.get("location", ""),
            "bio": gemini_extracted.get("bio", ""),
            "skills": ml_extracted.get("skills") or gemini_extracted.get("skills", []),
            "education": gemini_extracted.get("education") or ml_extracted.get("education", []),
            "experience": gemini_extracted.get("experience") or ml_extracted.get("experience", []),
            "projects": gemini_extracted.get("projects") or ml_extracted.get("projects", []),
            "achievements": gemini_extracted.get("achievements") or ml_extracted.get("achievements", []),
            "linkedin": ml_extracted.get("linkedin") or gemini_extracted.get("linkedin", ""),
            "github": ml_extracted.get("github") or gemini_extracted.get("github", ""),
        }

        resume_id = str(uuid.uuid4())

        # A successful response must mean the resume was actually persisted.
        # Previously database errors were swallowed, so the page looked successful
        # until the next login and then lost the resume state.
        if not student_id:
            raise HTTPException(status_code=409, detail="Create your student profile before uploading a resume")

        resume_data = {
            "student_id": student_id,
            "original_filename": file.filename,
            "parsed_text": parsed_text,
            "extracted_data": extracted,
            "status": "parsed",
        }
        try:
            result = supabase.table("resumes").insert(resume_data).execute()
        except Exception as dbe:
            logger.error(f"Could not save resume to DB: {dbe}")
            raise HTTPException(status_code=500, detail="Resume was parsed but could not be saved. Please try again.")
        if not result.data:
            raise HTTPException(status_code=500, detail="Resume was parsed but the database did not return a saved record")
        saved_resume = result.data[0]
        resume_id = saved_resume["id"]
        logger.info(f"Resume saved successfully with ID: {resume_id}")

        # Calculate ATS score immediately
        ats_score_data = calculate_ats_score(parsed_text)

        return {
            "resume_id": resume_id,
            "id": resume_id,
            "filename": file.filename,
            "original_filename": file.filename,
            "created_at": saved_resume.get("created_at"),
            "status": saved_resume.get("status", "parsed"),
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

@router.get("")
@router.get("/")
async def list_resumes(current_user=Depends(require_student)):
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
async def get_ats_score(resume_id: uuid.UUID, job_id: uuid.UUID = None, current_user=Depends(require_student)):
    """
    Calculate ATS score for a resume.
    If job_id provided, scores against specific job or placement drive requirements.
    """
    supabase = get_supabase()
    try:
        resume = _get_owned_resume(supabase, resume_id, current_user.id)

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

        score_result = calculate_ats_score(resume.get("parsed_text", ""), job_requirements)
        return score_result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ATS scoring error: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate ATS score")


@router.post("/{resume_id}/improve")
async def improve_resume_endpoint(resume_id: uuid.UUID, current_user=Depends(require_student)):
    """
    AI-powered resume improvement suggestions using Gemini.
    Returns: ATS score, missing keywords, weak descriptions, improvement tips.
    """
    supabase = get_supabase()
    try:
        resume = _get_owned_resume(supabase, resume_id, current_user.id)
        suggestions = await improve_resume(resume.get("parsed_text", ""))
        return suggestions

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resume improve error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate improvements")


@router.post("/{resume_id}/sync-to-profile")
@router.post("/{resume_id}/sync-to-profile/")
async def sync_resume_to_profile(
    resume_id: str,
    payload: Optional[SyncProfileRequest] = None,
    current_user=Depends(require_student)
):
    """
    Sync extracted resume data into the student's profile.
    Accepts optional extracted_data in body so frontend can sync directly even if resume record lookup is in progress.
    Merges skills (union), overwrites blank fields, never overwrites non-blank ones.
    """
    supabase = get_supabase()
    try:
        extracted = None

        # Option 1: Provided directly in payload body from frontend state
        if payload and payload.extracted_data:
            extracted = payload.extracted_data

        # Option 2: Lookup by resume_id in database
        if not extracted and resume_id and resume_id not in ("latest", "undefined", "null"):
            try:
                owned_resume = _get_owned_resume(supabase, resume_id, current_user.id)
                extracted = owned_resume.get("extracted_data")
            except Exception as re:
                logger.warning(f"Lookup by resume_id {resume_id} failed: {re}")

        # Option 3: Fallback to current user's most recently uploaded resume
        if not extracted:
            try:
                prof_check = supabase.table("student_profiles") \
                    .select("id").eq("user_id", str(current_user.id)).limit(1).execute()
                if prof_check.data and len(prof_check.data) > 0:
                    latest_resume = supabase.table("resumes").select("*") \
                        .eq("student_id", prof_check.data[0]["id"]) \
                        .order("created_at", desc=True).limit(1).execute()
                    if latest_resume.data and len(latest_resume.data) > 0:
                        extracted = latest_resume.data[0].get("extracted_data")
            except Exception as le:
                logger.warning(f"Lookup latest resume failed: {le}")

        if isinstance(extracted, str):
            try:
                extracted = json.loads(extracted)
            except Exception:
                pass

        if not extracted:
            raise HTTPException(
                status_code=404,
                detail="No extracted resume data found to sync. Please re-upload your resume first."
            )

        # Fetch current student profile
        profile_res = supabase.table("student_profiles") \
            .select("*").eq("user_id", str(current_user.id)).limit(1).execute()

        if not profile_res.data:
            # Auto-create initial profile row
            user_email = getattr(current_user, "email", "") or ""
            user_name = extracted.get("name") or getattr(current_user, "full_name", "") or "Student"
            new_prof = supabase.table("student_profiles").insert({
                "user_id": str(current_user.id),
                "full_name": user_name,
                "email": user_email,
                "profile_completion": 0,
            }).execute()
            if not new_prof.data:
                raise HTTPException(status_code=500, detail="Could not initialize student profile")
            profile = new_prof.data[0]
        else:
            profile = profile_res.data[0]

        # Build update payload — only fill blank fields, always merge skills
        update = {}

        def _fill_if_blank(field: str, value):
            """Only update a profile field if it is currently blank/empty."""
            current = profile.get(field)
            if not current and value:
                update[field] = value

        _fill_if_blank("full_name", extracted.get("name"))
        _fill_if_blank("phone", extracted.get("phone"))
        _fill_if_blank("location", extracted.get("location"))
        _fill_if_blank("bio", extracted.get("bio"))
        _fill_if_blank("github_url", extracted.get("github"))
        _fill_if_blank("linkedin_url", extracted.get("linkedin"))

        # Achievements: only sync if profile has none
        ext_achievements = extracted.get("achievements")
        if not profile.get("achievements") and ext_achievements:
            if isinstance(ext_achievements, list):
                valid_achievements = [str(a).strip() for a in ext_achievements if a]
                if valid_achievements:
                    update["achievements"] = "\n".join(f"• {a}" for a in valid_achievements)
            elif isinstance(ext_achievements, str) and ext_achievements.strip():
                update["achievements"] = ext_achievements.strip()

        # Skills: union of existing + extracted (deduplicated)
        existing_skills = profile.get("skills") or []
        new_skills = extracted.get("skills") or []
        merged_skills = list(dict.fromkeys(existing_skills + new_skills))  # preserves order, deduplicates
        if merged_skills != existing_skills:
            update["skills"] = merged_skills

        # Education: only sync if profile has none
        ext_education = extracted.get("education") or []
        if not profile.get("course") and ext_education:
            # Try to extract course from first education entry
            first_edu = ext_education[0] if ext_education else {}
            degree = first_edu.get("degree", "")
            if degree:
                update["course"] = degree
            if not profile.get("cgpa") and first_edu.get("cgpa"):
                try:
                    update["cgpa"] = float(first_edu["cgpa"])
                except (ValueError, TypeError):
                    pass
            if not profile.get("graduation_year") and first_edu.get("year"):
                try:
                    yr = int(first_edu["year"])
                    if 2000 <= yr <= 2035:
                        update["graduation_year"] = yr
                except (ValueError, TypeError):
                    pass
            if not profile.get("university") and first_edu.get("institution"):
                update["university"] = first_edu["institution"]

        if update.get("university"):
            normalized_name = str(update["university"]).strip().casefold()
            universities = (supabase.table("university_profiles").select("id,name").execute()).data or []
            matches = [
                u for u in universities
                if normalized_name in (u.get("name") or "").strip().casefold()
                or (u.get("name") or "").strip().casefold() in normalized_name
            ]
            if len(matches) == 1:
                update["university_id"] = matches[0]["id"]
                update["university"] = matches[0]["name"]
            elif len(universities) == 1:
                update["university_id"] = universities[0]["id"]
                update["university"] = universities[0]["name"]
            elif profile.get("university_id"):
                # Retain existing valid university_id; never overwrite with None
                update.pop("university_id", None)
        elif profile.get("university_id"):
            update.pop("university_id", None)

        # Work experience: merge/overwrite from resume if it has richer data
        ext_experience = extracted.get("experience") or []
        existing_exp = profile.get("work_experience") or []
        if ext_experience and len(ext_experience) >= len(existing_exp):
            work_exp = []
            for exp in ext_experience:
                # Handle both "role" and "title" key names from different parsers
                role = exp.get("role") or exp.get("title") or exp.get("position") or ""
                company = exp.get("company") or exp.get("organization") or ""
                if role or company:
                    work_exp.append({
                        "company": company,
                        "role": role,
                        "duration": exp.get("duration") or exp.get("dates") or "",
                        "description": exp.get("description") or exp.get("responsibilities") or "",
                        "skills_used": exp.get("skills_used") or exp.get("technologies") or [],
                    })
            if work_exp:
                update["work_experience"] = work_exp

        # Projects: merge/overwrite from resume if it has richer data
        ext_projects = extracted.get("projects") or []
        existing_proj = profile.get("projects") or []
        if ext_projects and len(ext_projects) >= len(existing_proj):
            projects = []
            for proj in ext_projects:
                name = proj.get("name") or proj.get("title") or ""
                if name and not name.upper().startswith(("TECHNICAL", "SKILL", "RAILWAY", "VERCEL")):
                    projects.append({
                        "name": name,
                        "description": proj.get("description") or "",
                        # Handle both "tech_stack" and "technologies" key names
                        "tech_stack": proj.get("tech_stack") or proj.get("technologies") or [],
                        "github_url": proj.get("github_url") or proj.get("github") or "",
                        "live_url": proj.get("live_url") or proj.get("url") or "",
                        "duration": proj.get("duration") or "",
                    })
            if projects:
                update["projects"] = projects

        if not update:
            return {"message": "Profile is already up to date. No new data to sync.", "synced_fields": []}

        # Sanitize any null bytes (\x00) from string values before sending to PostgreSQL
        def _sanitize(v):
            if isinstance(v, str):
                return v.replace("\x00", "")
            elif isinstance(v, list):
                return [_sanitize(x) for x in v]
            elif isinstance(v, dict):
                return {k: _sanitize(val) for k, val in v.items()}
            return v

        update = _sanitize(update)

        # Recalculate profile completion
        merged_profile = {**profile, **update}
        update["profile_completion"] = calculate_profile_completion(merged_profile)

        # Persist to student_profiles by primary key id
        result = supabase.table("student_profiles") \
            .update(update) \
            .eq("id", profile["id"]) \
            .execute()

        synced_fields = [k for k in update.keys() if k != "profile_completion"]
        return {
            "message": f"Profile synced successfully! {len(synced_fields)} field(s) updated.",
            "synced_fields": synced_fields,
            "profile_completion": update.get("profile_completion", profile.get("profile_completion", 0)),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Sync to profile error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to sync resume data to profile: {str(e)}")


@router.post("/cover-letter")
async def generate_cover_letter_endpoint(
    resume_id: uuid.UUID,
    job_id: uuid.UUID,
    current_user=Depends(require_student)
):
    """Generate AI cover letter from resume + job or placement drive description"""
    supabase = get_supabase()
    try:
        resume = _get_owned_resume(supabase, resume_id, current_user.id)

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
            resume_text=resume.get("parsed_text", ""),
            job=job_data
        )
        return {"cover_letter": cover_letter}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cover letter generation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate cover letter")
