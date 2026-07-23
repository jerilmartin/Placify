"""Jobs router — CRUD + AI-powered search"""

from fastapi import APIRouter, HTTPException, Depends, Query
from app.models.job import JobCreate, JobUpdate, JobResponse, JobMatchResponse
from app.middleware.auth import get_current_user
from app.database import get_supabase
from app.services.matching_service import compute_job_matches
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=list[JobResponse])
async def list_jobs(
    page: int = 1,
    limit: int = 20,
    job_type: str = None,
    skill: str = None,
    location: str = None,
    current_user=Depends(get_current_user)
):
    """List active jobs with optional filters"""
    supabase = get_supabase()
    try:
        query = supabase.table("jobs").select("*").eq("status", "active")
        if skill:
            query = query.contains("skills_required", [skill])
        if location:
            query = query.ilike("location", f"%{location}%")
        if job_type:
            query = query.eq("job_type", job_type)
        offset = (page - 1) * limit
        result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch jobs")


@router.get("/matches", response_model=list[JobMatchResponse])
async def get_job_matches(current_user=Depends(get_current_user)):
    """
    Get AI-powered job matches for current student.
    Uses: Sentence Transformers + FAISS (ML) or keyword overlap (fallback)
    """
    supabase = get_supabase()
    try:
        # Get student profile
        profile_res = supabase.table("student_profiles") \
            .select("*").eq("user_id", str(current_user.id)).limit(1).execute()
        if not profile_res.data:
            raise HTTPException(status_code=404, detail="Complete your profile first")

        profile = profile_res.data[0]

        # Get existing matches
        matches = supabase.table("job_matches") \
            .select("*, jobs(*)") \
            .eq("student_id", profile["id"]) \
            .order("match_score", desc=True) \
            .execute()

        if matches.data:
            return matches.data

        # Compute fresh matches if none exist
        jobs = supabase.table("jobs").select("*").eq("status", "active").execute()
        computed = await compute_job_matches(profile, jobs.data or [])
        return computed

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error computing job matches: {e}")
        raise HTTPException(status_code=500, detail="Failed to compute job matches")


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: uuid.UUID, current_user=Depends(get_current_user)):
    """Get job by ID"""
    supabase = get_supabase()
    try:
        result = supabase.table("jobs").select("*").eq("id", str(job_id)).limit(1).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Job not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch job")


@router.post("/", response_model=JobResponse, status_code=201)
async def create_job(data: JobCreate, current_user=Depends(get_current_user)):
    """Create a new job (recruiter/university only)"""
    supabase = get_supabase()
    try:
        payload = data.model_dump()
        payload["recruiter_id"] = str(current_user.id)
        result = supabase.table("jobs").insert(payload).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create job")


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(job_id: uuid.UUID, data: JobUpdate, current_user=Depends(get_current_user)):
    """Update job posting"""
    supabase = get_supabase()
    try:
        result = supabase.table("jobs") \
            .update(data.model_dump(exclude_none=True)) \
            .eq("id", str(job_id)) \
            .execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update job")


@router.delete("/{job_id}")
async def delete_job(job_id: uuid.UUID, current_user=Depends(get_current_user)):
    """Delete/close job posting"""
    supabase = get_supabase()
    supabase.table("jobs").update({"status": "closed"}).eq("id", str(job_id)).execute()
    return {"message": "Job closed successfully"}
