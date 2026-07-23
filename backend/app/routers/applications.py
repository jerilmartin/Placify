"""Applications router"""

from fastapi import APIRouter, HTTPException, Depends, status
from app.models.application import ApplicationCreate, ApplicationUpdate, ApplicationResponse
from app.middleware.auth import get_current_user
from app.database import get_supabase
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=list[ApplicationResponse])
async def list_my_applications(current_user=Depends(get_current_user)):
    """List all applications for current student"""
    supabase = get_supabase()
    try:
        profile = supabase.table("student_profiles") \
            .select("id").eq("user_id", str(current_user.id)).limit(1).execute()
        if not profile.data:
            return []
        result = supabase.table("applications") \
            .select("*, jobs(title, company, location, package_lpa)") \
            .eq("student_id", profile.data[0]["id"]) \
            .order("applied_at", desc=True) \
            .execute()
        return result.data or []
    except Exception as e:
        logger.error(f"Error fetching applications: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch applications")


@router.post("/", response_model=ApplicationResponse, status_code=201)
async def apply_to_job(data: ApplicationCreate, current_user=Depends(get_current_user)):
    """Apply to a job"""
    supabase = get_supabase()
    try:
        profile = supabase.table("student_profiles") \
            .select("id").eq("user_id", str(current_user.id)).limit(1).execute()
        if not profile.data:
            raise HTTPException(status_code=404, detail="Complete your profile first")

        student_id = profile.data[0]["id"]

        # Check if already applied
        existing = supabase.table("applications") \
            .select("id") \
            .eq("student_id", student_id) \
            .eq("job_id", str(data.job_id)) \
            .execute()
        if existing.data:
            raise HTTPException(status_code=409, detail="Already applied to this job")

        payload = {
            "student_id": student_id,
            "job_id": str(data.job_id),
            "cover_letter": data.cover_letter,
            "status": "submitted",
        }
        result = supabase.table("applications").insert(payload).execute()
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting application: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit application")


@router.get("/job/{job_id}", response_model=list[ApplicationResponse])
async def list_applications_for_job(job_id: uuid.UUID, current_user=Depends(get_current_user)):
    """List all applications for a job (recruiter view)"""
    supabase = get_supabase()
    try:
        result = supabase.table("applications") \
            .select("*, student_profiles(full_name, email, cgpa, skills)") \
            .eq("job_id", str(job_id)) \
            .order("created_at", desc=True) \
            .execute()
        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch applications")


@router.put("/{application_id}", response_model=ApplicationResponse)
async def update_application_status(
    application_id: uuid.UUID,
    data: ApplicationUpdate,
    current_user=Depends(get_current_user)
):
    """Update application status (recruiter/university)"""
    supabase = get_supabase()
    try:
        result = supabase.table("applications") \
            .update(data.model_dump(exclude_none=True)) \
            .eq("id", str(application_id)) \
            .execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update application")


@router.delete("/{application_id}")
async def withdraw_application(application_id: uuid.UUID, current_user=Depends(get_current_user)):
    """Withdraw an application"""
    supabase = get_supabase()
    supabase.table("applications").update({"status": "withdrawn"}).eq("id", str(application_id)).execute()
    return {"message": "Application withdrawn"}
