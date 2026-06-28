"""Recruiters router"""

from fastapi import APIRouter, HTTPException, Depends
from app.models.recruiter import RecruiterProfileCreate, RecruiterProfileUpdate, RecruiterProfileResponse
from app.middleware.auth import get_current_user
from app.database import get_supabase
from app.services.gemini_service import recruiter_ai_search
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/profile", response_model=RecruiterProfileResponse)
async def get_my_recruiter_profile(current_user=Depends(get_current_user)):
    supabase = get_supabase()
    result = supabase.table("recruiter_profiles").select("*").eq("user_id", str(current_user.id)).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Recruiter profile not found")
    return result.data


@router.post("/profile", response_model=RecruiterProfileResponse, status_code=201)
async def create_recruiter_profile(data: RecruiterProfileCreate, current_user=Depends(get_current_user)):
    supabase = get_supabase()
    payload = data.model_dump()
    payload["user_id"] = str(current_user.id)
    result = supabase.table("recruiter_profiles").insert(payload).execute()
    return result.data[0]


@router.put("/profile", response_model=RecruiterProfileResponse)
async def update_recruiter_profile(data: RecruiterProfileUpdate, current_user=Depends(get_current_user)):
    supabase = get_supabase()
    result = supabase.table("recruiter_profiles") \
        .update(data.model_dump(exclude_none=True)) \
        .eq("user_id", str(current_user.id)) \
        .execute()
    return result.data[0]


@router.get("/candidates")
async def get_ai_sorted_candidates(job_id: uuid.UUID, current_user=Depends(get_current_user)):
    """
    Get AI-sorted candidates for a job.
    Returns candidates sorted by match score (ML + Gemini analysis).
    """
    supabase = get_supabase()
    try:
        # Get all applications for this job with student profiles
        applications = supabase.table("applications") \
            .select("*, student_profiles(*)") \
            .eq("job_id", str(job_id)) \
            .execute()

        job = supabase.table("jobs").select("*").eq("id", str(job_id)).single().execute()

        if not applications.data or not job.data:
            return []

        # Sort by match score (pre-computed) or compute on the fly
        candidates = sorted(
            applications.data,
            key=lambda x: x.get("match_score", 0),
            reverse=True
        )
        return candidates
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch candidates")


@router.post("/ai-search")
async def ai_candidate_search(query: str, current_user=Depends(get_current_user)):
    """
    Natural language candidate search.
    Example: "Find students with Python, FastAPI and AWS experience"
    Gemini converts this to structured query, then searches DB.
    """
    supabase = get_supabase()
    try:
        result = await recruiter_ai_search(query, supabase)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="AI search failed")
