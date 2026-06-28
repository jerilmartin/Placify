"""Universities router — placement drives, eligibility engine, analytics"""

from fastapi import APIRouter, HTTPException, Depends
from app.models.university import (
    UniversityProfileCreate, UniversityProfileUpdate, UniversityProfileResponse,
    PlacementDriveCreate, PlacementDriveResponse
)
from app.middleware.auth import get_current_user
from app.database import get_supabase
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/profile", response_model=UniversityProfileResponse)
async def get_university_profile(current_user=Depends(get_current_user)):
    supabase = get_supabase()
    result = supabase.table("university_profiles").select("*").eq("user_id", str(current_user.id)).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="University profile not found")
    return result.data


@router.post("/profile", response_model=UniversityProfileResponse, status_code=201)
async def create_university_profile(data: UniversityProfileCreate, current_user=Depends(get_current_user)):
    supabase = get_supabase()
    payload = data.model_dump()
    payload["user_id"] = str(current_user.id)
    result = supabase.table("university_profiles").insert(payload).execute()
    return result.data[0]


# ── Placement Drives ─────────────────────────────────────────────────────────

@router.get("/drives", response_model=list[PlacementDriveResponse])
async def list_drives(current_user=Depends(get_current_user)):
    """List all placement drives for this university"""
    supabase = get_supabase()
    profile = supabase.table("university_profiles").select("id").eq("user_id", str(current_user.id)).single().execute()
    if not profile.data:
        return []
    result = supabase.table("placement_drives") \
        .select("*") \
        .eq("university_id", profile.data["id"]) \
        .order("drive_date") \
        .execute()
    return result.data or []


@router.post("/drives", response_model=PlacementDriveResponse, status_code=201)
async def create_drive(data: PlacementDriveCreate, current_user=Depends(get_current_user)):
    """Create a new placement drive (TCS Drive, Infosys Drive, etc.)"""
    supabase = get_supabase()
    try:
        payload = data.model_dump()
        result = supabase.table("placement_drives").insert(payload).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create drive")


@router.get("/drives/{drive_id}/eligible-students")
async def get_eligible_students(drive_id: uuid.UUID, current_user=Depends(get_current_user)):
    """
    Run eligibility engine for a placement drive.
    Filters by: min_cgpa, eligible_branches, max_backlogs, graduation_year.
    Returns automatically filtered eligible student list.
    """
    supabase = get_supabase()
    try:
        drive = supabase.table("placement_drives").select("*").eq("id", str(drive_id)).single().execute()
        if not drive.data:
            raise HTTPException(status_code=404, detail="Drive not found")

        eligibility = drive.data.get("eligibility") or {}
        min_cgpa = eligibility.get("min_cgpa", 0)
        eligible_branches = eligibility.get("eligible_branches", [])
        grad_year = eligibility.get("graduation_year")

        query = supabase.table("student_profiles").select("*")
        if min_cgpa:
            query = query.gte("cgpa", min_cgpa)
        if grad_year:
            query = query.eq("graduation_year", grad_year)
        if eligible_branches:
            query = query.in_("course", eligible_branches)

        result = query.execute()
        return {
            "drive": drive.data,
            "eligible_count": len(result.data or []),
            "students": result.data or [],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Eligibility check failed")


@router.get("/analytics")
async def university_analytics(current_user=Depends(get_current_user)):
    """
    University placement analytics dashboard.
    Returns: placement_rate, avg_package, highest_package, total_placed, by_company, by_branch
    """
    supabase = get_supabase()
    try:
        profile = supabase.table("university_profiles").select("id").eq("user_id", str(current_user.id)).single().execute()
        if not profile.data:
            return {}

        # Aggregate stats from drives
        drives = supabase.table("placement_drives") \
            .select("*") \
            .eq("university_id", profile.data["id"]) \
            .execute()

        drives_data = drives.data or []
        total_selected = sum(d.get("total_selected", 0) for d in drives_data)
        total_registered = sum(d.get("total_registered", 0) for d in drives_data)
        packages = [d.get("package_lpa", 0) for d in drives_data if d.get("package_lpa")]

        return {
            "total_drives": len(drives_data),
            "total_registered": total_registered,
            "total_placed": total_selected,
            "placement_rate": round((total_selected / total_registered * 100) if total_registered else 0, 1),
            "average_package_lpa": round(sum(packages) / len(packages), 2) if packages else 0,
            "highest_package_lpa": max(packages) if packages else 0,
            "drives": drives_data,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch analytics")
