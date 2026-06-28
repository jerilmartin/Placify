"""
Students router
Endpoints: CRUD for student profiles, profile completion, placement probability
"""

from fastapi import APIRouter, HTTPException, Depends, status
from app.models.student import (
    StudentProfileCreate, StudentProfileUpdate, StudentProfileResponse
)
from app.middleware.auth import get_current_user, require_role
from app.database import get_supabase
from app.services.scoring_service import calculate_profile_completion
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/profile", response_model=StudentProfileResponse)
async def get_my_profile(current_user=Depends(get_current_user)):
    """Get current student's profile"""
    supabase = get_supabase()
    try:
        result = supabase.table("student_profiles") \
            .select("*") \
            .eq("user_id", str(current_user.id)) \
            .single() \
            .execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Profile not found. Please complete onboarding.")
        return result.data
    except Exception as e:
        logger.error(f"Error fetching profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch profile")


@router.post("/profile", response_model=StudentProfileResponse, status_code=201)
async def create_profile(data: StudentProfileCreate, current_user=Depends(get_current_user)):
    """Create student profile (onboarding)"""
    supabase = get_supabase()
    try:
        payload = data.model_dump()
        payload["user_id"] = str(current_user.id)
        payload["profile_completion"] = calculate_profile_completion(payload)
        result = supabase.table("student_profiles").insert(payload).execute()
        return result.data[0]
    except Exception as e:
        logger.error(f"Error creating profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to create profile")


@router.put("/profile", response_model=StudentProfileResponse)
async def update_profile(data: StudentProfileUpdate, current_user=Depends(get_current_user)):
    """Update current student's profile"""
    supabase = get_supabase()
    try:
        update_data = data.model_dump(exclude_none=True)
        # Recalculate completion
        profile_result = supabase.table("student_profiles") \
            .select("*").eq("user_id", str(current_user.id)).single().execute()
        if profile_result.data:
            merged = {**profile_result.data, **update_data}
            update_data["profile_completion"] = calculate_profile_completion(merged)

        result = supabase.table("student_profiles") \
            .update(update_data) \
            .eq("user_id", str(current_user.id)) \
            .execute()
        return result.data[0]
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")


@router.get("/{student_id}", response_model=StudentProfileResponse)
async def get_student_by_id(student_id: uuid.UUID, current_user=Depends(get_current_user)):
    """Get student profile by ID (recruiters/universities/mentors)"""
    supabase = get_supabase()
    try:
        result = supabase.table("student_profiles") \
            .select("*").eq("id", str(student_id)).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Student not found")
        return result.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch student")


@router.get("/", response_model=list[StudentProfileResponse])
async def list_students(
    page: int = 1,
    limit: int = 20,
    skill: str = None,
    min_cgpa: float = None,
    current_user=Depends(get_current_user)
):
    """List all students (for recruiters/universities)"""
    supabase = get_supabase()
    try:
        query = supabase.table("student_profiles").select("*")
        if skill:
            query = query.contains("skills", [skill])
        if min_cgpa:
            query = query.gte("cgpa", min_cgpa)
        offset = (page - 1) * limit
        result = query.range(offset, offset + limit - 1).execute()
        return result.data or []
    except Exception as e:
        logger.error(f"Error listing students: {e}")
        raise HTTPException(status_code=500, detail="Failed to list students")
