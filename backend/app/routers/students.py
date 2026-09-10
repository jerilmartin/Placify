"""
Students router
Endpoints: CRUD for student profiles, profile completion, placement probability
"""

from fastapi import APIRouter, HTTPException, Depends
from app.models.student import (
    StudentProfileCreate, StudentProfileUpdate, StudentProfileResponse
)
from app.middleware.auth import require_role, require_student
from app.database import get_supabase
from app.services.scoring_service import calculate_profile_completion
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/profile", response_model=StudentProfileResponse)
async def get_my_profile(current_user=Depends(require_student)):
    """Get current student's profile"""
    supabase = get_supabase()
    try:
        result = supabase.table("student_profiles") \
            .select("*") \
            .eq("user_id", str(current_user.id)) \
            .limit(1) \
            .execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Profile not found. Please complete onboarding.")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch profile")


@router.post("/profile", response_model=StudentProfileResponse, status_code=201)
async def create_profile(data: StudentProfileCreate, current_user=Depends(require_student)):
    """Create student profile (onboarding)"""
    supabase = get_supabase()
    try:
        payload = data.model_dump()
        payload["user_id"] = str(current_user.id)
        if payload.get("university"):
            normalized_name = payload["university"].strip().casefold()
            universities = supabase.table("university_profiles") \
                .select("id,name").execute()
            matches = [
                university for university in (universities.data or [])
                if (university.get("name") or "").strip().casefold() == normalized_name
            ]
            payload["university_id"] = matches[0]["id"] if len(matches) == 1 else None
        payload["profile_completion"] = calculate_profile_completion(payload)
        result = supabase.table("student_profiles").insert(payload).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Profile creation returned no data")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to create profile")


@router.put("/profile", response_model=StudentProfileResponse)
async def update_profile(data: StudentProfileUpdate, current_user=Depends(require_student)):
    """Update current student's profile"""
    supabase = get_supabase()
    try:
        update_data = data.model_dump(exclude_none=True)
        if "university" in update_data:
            normalized_name = (update_data["university"] or "").strip().casefold()
            universities = supabase.table("university_profiles") \
                .select("id,name").execute()
            matches = [
                university for university in (universities.data or [])
                if (university.get("name") or "").strip().casefold() == normalized_name
            ]
            # Never retain or accept an unrelated tenant link after the display
            # name changes. Ambiguous/unmatched names require admin resolution.
            update_data["university_id"] = matches[0]["id"] if len(matches) == 1 else None
        # Fetch current profile to merge and recalculate completion
        profile_result = supabase.table("student_profiles") \
            .select("*").eq("user_id", str(current_user.id)).limit(1).execute()
        if not profile_result.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        merged = {**profile_result.data[0], **update_data}
        update_data["profile_completion"] = calculate_profile_completion(merged)

        result = supabase.table("student_profiles") \
            .update(update_data) \
            .eq("user_id", str(current_user.id)) \
            .execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Update returned no data")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")


@router.get("/{student_id}", response_model=StudentProfileResponse)
async def get_student_by_id(
    student_id: uuid.UUID,
    current_user=Depends(require_role("recruiter", "university", "placement_officer", "mentor", "admin")),
):
    """Get student profile by ID (recruiters/universities/mentors)"""
    supabase = get_supabase()
    try:
        result = supabase.table("student_profiles") \
            .select("*").eq("id", str(student_id)).limit(1).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Student not found")
        student = result.data[0]
        role = current_user.role
        allowed = role == "admin"

        if role in {"university", "placement_officer"}:
            university = supabase.table("university_profiles").select("id") \
                .eq("user_id", str(current_user.id)).limit(1).execute()
            allowed = bool(
                university.data
                and student.get("university_id") == university.data[0]["id"]
            )
        elif role == "recruiter":
            applications = supabase.table("applications").select("job_id") \
                .eq("student_id", str(student_id)).execute()
            job_ids = [row["job_id"] for row in (applications.data or []) if row.get("job_id")]
            if job_ids:
                owned_job = supabase.table("jobs").select("id") \
                    .in_("id", job_ids).eq("recruiter_id", str(current_user.id)).limit(1).execute()
                allowed = bool(owned_job.data)
        elif role == "mentor":
            mentor = supabase.table("mentor_profiles").select("id") \
                .eq("user_id", str(current_user.id)).limit(1).execute()
            if mentor.data:
                session = supabase.table("mentor_sessions").select("id") \
                    .eq("mentor_id", mentor.data[0]["id"]) \
                    .eq("student_id", str(student_id)).limit(1).execute()
                allowed = bool(session.data)

        if not allowed:
            raise HTTPException(status_code=403, detail="You do not have access to this student")
        return student
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching student {student_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch student")


@router.get("/", response_model=list[StudentProfileResponse])
async def list_students(
    page: int = 1,
    limit: int = 20,
    skill: str = None,
    min_cgpa: float = None,
    current_user=Depends(require_role("university", "placement_officer", "admin"))
):
    """List students for the current university, or all students for admins."""
    supabase = get_supabase()
    try:
        query = supabase.table("student_profiles").select("*")
        if current_user.role != "admin":
            university = supabase.table("university_profiles").select("id") \
                .eq("user_id", str(current_user.id)).limit(1).execute()
            if not university.data:
                return []
            query = query.eq("university_id", university.data[0]["id"])
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
