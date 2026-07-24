"""Universities router — placement drives, eligibility engine, analytics"""

from fastapi import APIRouter, HTTPException, Depends
from app.models.university import (
    UniversityProfileCreate, UniversityProfileUpdate, UniversityProfileResponse,
    PlacementDriveCreate, PlacementDriveResponse
)
from app.models.drive_request import DriveRequestReview
from app.middleware.auth import require_university
from app.database import get_supabase
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/profile", response_model=UniversityProfileResponse)
async def get_university_profile(current_user=Depends(require_university)):
    supabase = get_supabase()
    result = supabase.table("university_profiles").select("*").eq("user_id", str(current_user.id)).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="University profile not found")
    return result.data[0]


@router.post("/profile", response_model=UniversityProfileResponse, status_code=201)
async def create_university_profile(data: UniversityProfileCreate, current_user=Depends(require_university)):
    supabase = get_supabase()
    payload = data.model_dump()
    payload["user_id"] = str(current_user.id)
    result = supabase.table("university_profiles").insert(payload).execute()
    return result.data[0]


# ── Placement Drives ─────────────────────────────────────────────────────────

@router.get("/drives", response_model=list[PlacementDriveResponse])
async def list_drives(current_user=Depends(require_university)):
    """List all placement drives for this university"""
    supabase = get_supabase()
    profile = supabase.table("university_profiles").select("id").eq("user_id", str(current_user.id)).limit(1).execute()
    if not profile.data:
        return []
    result = supabase.table("placement_drives") \
        .select("*") \
        .eq("university_id", profile.data[0]["id"]) \
        .order("drive_date") \
        .execute()
    return result.data or []


@router.post("/drives", response_model=PlacementDriveResponse, status_code=201)
async def create_drive(data: PlacementDriveCreate, current_user=Depends(require_university)):
    """Create a new placement drive (TCS Drive, Infosys Drive, etc.)"""
    supabase = get_supabase()
    try:
        profile = supabase.table("university_profiles") \
            .select("id").eq("user_id", str(current_user.id)).limit(1).execute()
        if not profile.data:
            raise HTTPException(status_code=404, detail="Complete your university profile first")
        payload = data.model_dump(exclude_none=True)
        payload["university_id"] = profile.data[0]["id"]
        result = supabase.table("placement_drives").insert(payload).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Drive creation returned no data")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create placement drive: {e}")
        raise HTTPException(status_code=500, detail="Failed to create drive")


@router.get("/drives/{drive_id}/eligible-students")
async def get_eligible_students(drive_id: uuid.UUID, current_user=Depends(require_university)):
    """
    Run eligibility engine for a placement drive.
    Filters by: min_cgpa, eligible_branches, max_backlogs, graduation_year.
    Returns automatically filtered eligible student list.
    """
    supabase = get_supabase()
    try:
        university = supabase.table("university_profiles") \
            .select("id,name").eq("user_id", str(current_user.id)).limit(1).execute()
        if not university.data:
            raise HTTPException(status_code=404, detail="University profile not found")
        drive_result = supabase.table("placement_drives").select("*") \
            .eq("id", str(drive_id)) \
            .eq("university_id", university.data[0]["id"]) \
            .limit(1).execute()
        if not drive_result.data:
            raise HTTPException(status_code=404, detail="Drive not found")

        drive = drive_result.data[0]
        eligibility = drive.get("eligibility") or {}
        min_cgpa = eligibility.get("min_cgpa", 0)
        max_backlogs = eligibility.get("max_backlogs", None)
        eligible_branches = eligibility.get("eligible_branches", [])
        grad_year = eligibility.get("graduation_year")

        query = supabase.table("student_profiles").select("*") \
            .ilike("university", university.data[0]["name"])
        if min_cgpa:
            query = query.gte("cgpa", min_cgpa)
        if grad_year:
            query = query.eq("graduation_year", grad_year)
        # max_backlogs: only apply filter if explicitly set (0 means "no backlogs allowed")
        if max_backlogs is not None:
            query = query.lte("active_backlogs", max_backlogs)

        result = query.execute()
        students = result.data or []

        # eligible_branches: do intelligent alias-aware match in Python
        if eligible_branches:
            BRANCH_ALIASES = {
                "cs": ["cs", "cse", "computer science", "comp sci", "computer engineering", "software"],
                "cse": ["cs", "cse", "computer science", "comp sci", "computer engineering", "software"],
                "computer science": ["cs", "cse", "computer science", "comp sci", "computer engineering", "software"],
                "it": ["it", "information technology", "info tech"],
                "information technology": ["it", "information technology", "info tech"],
                "ece": ["ece", "electronics", "ec", "telecommunication", "communication"],
                "electronics": ["ece", "electronics", "ec", "telecommunication", "communication"],
                "eee": ["eee", "electrical", "ee"],
                "electrical": ["eee", "electrical", "ee"],
                "mech": ["mech", "mechanical"],
                "mechanical": ["mech", "mechanical"],
                "civil": ["civil"],
                "ai": ["ai", "ml", "artificial intelligence", "machine learning", "data science"],
                "ml": ["ai", "ml", "artificial intelligence", "machine learning", "data science"],
                "data science": ["ai", "ml", "artificial intelligence", "machine learning", "data science"],
            }

            def student_matches(course_str: str) -> bool:
                c_norm = course_str.lower().strip()
                for req in eligible_branches:
                    r_norm = req.lower().strip()
                    if r_norm in c_norm or c_norm in r_norm:
                        return True
                    aliases = BRANCH_ALIASES.get(r_norm, [])
                    if any(alias in c_norm for alias in aliases):
                        return True
                return False

            students = [
                s for s in students
                if s.get("course") and student_matches(s["course"])
            ]

        return {
            "drive": drive,
            "eligible_count": len(students),
            "students": students,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Eligibility check failed for drive {drive_id}: {e}")
        raise HTTPException(status_code=500, detail="Eligibility check failed")


@router.get("/recruiters")
async def list_recruiters(current_user=Depends(require_university)):
    """List recruiter companies available for university onboarding review."""
    supabase = get_supabase()
    university = supabase.table("university_profiles") \
        .select("verified").eq("user_id", str(current_user.id)).limit(1).execute()
    if not university.data or not university.data[0].get("verified"):
        raise HTTPException(status_code=403, detail="Verified university access required")
    result = (
        supabase.table("recruiter_profiles")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.get("/drive-requests")
async def list_drive_requests(
    status_filter: str | None = None,
    current_user=Depends(require_university),
):
    """List campus-drive proposals addressed to the current university."""
    supabase = get_supabase()
    university = (
        supabase.table("university_profiles")
        .select("id,verified")
        .eq("user_id", str(current_user.id))
        .limit(1)
        .execute()
    )
    if not university.data:
        raise HTTPException(status_code=404, detail="University profile not found")
    query = (
        supabase.table("drive_requests")
        .select(
            "*, recruiter_profiles("
            "id,company_name,contact_email,company_website,industry,verified"
            "), placement_drives(id,status,created_at)"
        )
        .eq("university_id", university.data[0]["id"])
    )
    if status_filter:
        allowed = {
            "pending",
            "changes_requested",
            "approved",
            "rejected",
            "cancelled",
        }
        if status_filter not in allowed:
            raise HTTPException(status_code=422, detail="Invalid drive request status")
        query = query.eq("status", status_filter)
    result = query.order("created_at", desc=True).execute()
    return result.data or []


@router.put("/drive-requests/{request_id}/review")
async def review_drive_request(
    request_id: uuid.UUID,
    review: DriveRequestReview,
    current_user=Depends(require_university),
):
    """
    Approve, reject, or request changes. Approval invokes a database function
    that creates the placement drive and records the decision atomically.
    """
    supabase = get_supabase()
    university = (
        supabase.table("university_profiles")
        .select("id,verified")
        .eq("user_id", str(current_user.id))
        .limit(1)
        .execute()
    )
    if not university.data or not university.data[0].get("verified"):
        raise HTTPException(status_code=403, detail="Verified university access required")
    request = (
        supabase.table("drive_requests")
        .select("id,status")
        .eq("id", str(request_id))
        .eq("university_id", university.data[0]["id"])
        .limit(1)
        .execute()
    )
    if not request.data:
        raise HTTPException(status_code=404, detail="Drive request not found")
    if request.data[0]["status"] != "pending":
        raise HTTPException(status_code=409, detail="Only pending requests can be reviewed")

    try:
        supabase.rpc(
            "review_drive_request",
            {
                "p_request_id": str(request_id),
                "p_reviewer_user_id": str(current_user.id),
                "p_action": review.action,
                "p_notes": review.notes,
            },
        ).execute()
    except Exception as exc:
        logger.error("Drive request review failed for %s: %s", request_id, exc)
        raise HTTPException(status_code=500, detail="Drive request review failed") from exc

    result = (
        supabase.table("drive_requests")
        .select(
            "*, recruiter_profiles(id,company_name,contact_email), "
            "placement_drives(id,status,created_at)"
        )
        .eq("id", str(request_id))
        .limit(1)
        .execute()
    )
    return result.data[0]


@router.put("/recruiters/{recruiter_id}/verification")
async def set_recruiter_verification(
    recruiter_id: uuid.UUID,
    verified: bool,
    current_user=Depends(require_university),
):
    """Approve or revoke a recruiter profile at platform level."""
    supabase = get_supabase()
    university = supabase.table("university_profiles") \
        .select("verified").eq("user_id", str(current_user.id)).limit(1).execute()
    if not university.data or not university.data[0].get("verified"):
        raise HTTPException(status_code=403, detail="Verified university access required")
    result = (
        supabase.table("recruiter_profiles")
        .update({"verified": verified})
        .eq("id", str(recruiter_id))
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Recruiter profile not found")
    return result.data[0]


@router.get("/analytics")
async def university_analytics(current_user=Depends(require_university)):
    """
    University placement analytics dashboard.
    Returns: placement_rate, avg_package, highest_package, total_placed, by_company, by_branch
    """
    supabase = get_supabase()
    try:
        profile = supabase.table("university_profiles").select("id").eq("user_id", str(current_user.id)).limit(1).execute()
        if not profile.data:
            return {}

        # Aggregate stats from drives
        drives = supabase.table("placement_drives") \
            .select("*") \
            .eq("university_id", profile.data[0]["id"]) \
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
