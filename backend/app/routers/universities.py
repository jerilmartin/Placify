"""Universities router — placement drives, eligibility engine, analytics"""

from fastapi import APIRouter, HTTPException, Depends
from app.models.university import (
    UniversityProfileCreate, UniversityProfileUpdate, UniversityProfileResponse,
    PlacementDriveCreate, PlacementDriveResponse
)
from app.models.drive_request import DriveRequestReview
from app.middleware.auth import require_university
from app.database import get_supabase
from app.services.eligibility_service import is_eligible_for_drive
import logging
import uuid
from datetime import date
from typing import Optional

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
    drives = result.data or []
    if drives:
        analytics = await university_analytics(current_user)
        counts = {
            drive["id"]: (drive["total_registered"], drive["total_selected"])
            for drive in analytics["drives"]
        }
        for drive in drives:
            drive["total_registered"], drive["total_selected"] = counts.get(drive["id"], (0, 0))
    return drives


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
        university_id = university.data[0]["id"]
        students = supabase.table("student_profiles").select("*") \
            .eq("university_id", university_id).execute().data or []
        # Older profiles may not yet have the tenant FK. Include only unlinked
        # exact-name matches, and run the same eligibility checks on them.
        legacy = supabase.table("student_profiles").select("*") \
            .is_("university_id", "null") \
            .ilike("university", university.data[0]["name"]).execute().data or []
        students = [student for student in [*students, *legacy]
                    if is_eligible_for_drive(student, eligibility)]

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


@router.get("/students")
async def list_university_students(current_user=Depends(require_university)):
    """List only students linked to the authenticated university."""
    supabase = get_supabase()
    university = (
        supabase.table("university_profiles")
        .select("id")
        .eq("user_id", str(current_user.id))
        .limit(1)
        .execute()
    )
    if not university.data:
        raise HTTPException(status_code=404, detail="University profile not found")

    result = (
        supabase.table("student_profiles")
        .select(
            "id,full_name,email,course,cgpa,active_backlogs,graduation_year,"
            "profile_completion,skills"
        )
        .eq("university_id", university.data[0]["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.get("/drive-requests")
async def list_drive_requests(
    status_filter: Optional[str] = None,
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
    """Tenant-scoped, application-backed placement analytics (never cached counters)."""
    supabase = get_supabase()
    try:
        profile = supabase.table("university_profiles").select("id,name").eq("user_id", str(current_user.id)).limit(1).execute()
        if not profile.data:
            raise HTTPException(status_code=404, detail="University profile not found")

        university_id = profile.data[0]["id"]
        def fetch_all(table, columns, field, value):
            items = []
            offset = 0
            while True:
                page = (supabase.table(table).select(columns).eq(field, value).order("id")
                        .range(offset, offset + 999).execute()).data or []
                items.extend(page)
                if len(page) < 1000:
                    return items
                offset += 1000

        drives_data = fetch_all(
            "placement_drives",
            "id,title,role,company_name,package_lpa,drive_date,registration_deadline,status,created_at,location,eligibility",
            "university_id", university_id,
        )
        students = fetch_all("student_profiles", "id,course", "university_id", university_id)
        drive_ids = [drive["id"] for drive in drives_data]
        applications = []
        # Query only this university's drives; chunk UUID filters to keep URLs bounded.
        for start in range(0, len(drive_ids), 100):
            ids = drive_ids[start:start + 100]
            offset = 0
            while True:
                page = (supabase.table("drive_applications")
                        .select("id,drive_id,student_id,status").in_("drive_id", ids).order("id")
                        .range(offset, offset + 999).execute()).data or []
                applications.extend(page)
                if len(page) < 1000:
                    break
                offset += 1000

        selected_statuses = {"selected", "offered", "accepted", "placed"}
        student_ids = {student["id"] for student in students}
        active_apps = [
            app for app in applications
            if app.get("student_id") in student_ids
            and (app.get("status") or "").lower() != "withdrawn"
        ]
        selected_apps = [app for app in active_apps if (app.get("status") or "").lower() in selected_statuses]
        for drive in drives_data:
            drive["total_registered"] = len({app["student_id"] for app in active_apps if app["drive_id"] == drive["id"]})
            drive["total_selected"] = len({app["student_id"] for app in selected_apps if app["drive_id"] == drive["id"]})

        today = date.today().isoformat()
        active_drives = sum(
            drive.get("status") in {"active", "upcoming"}
            and (drive.get("registration_deadline") or drive.get("drive_date") or today) >= today
            for drive in drives_data
        )
        registered_ids = {app["student_id"] for app in active_apps}
        selected_ids = {app["student_id"] for app in selected_apps}
        packages = [drive["package_lpa"] for drive in drives_data if drive.get("package_lpa")]

        return {
            "university_name": profile.data[0]["name"],
            "total_drives": len(drives_data),
            "active_drives": active_drives,
            "total_students": len(students),
            "total_registered": len(registered_ids),
            "total_placed": len(selected_ids),
            "placement_rate": round(len(selected_ids) / len(registered_ids) * 100, 1) if registered_ids else 0,
            "average_package_lpa": round(sum(packages) / len(packages), 2) if packages else 0,
            "highest_package_lpa": max(packages) if packages else 0,
            "drives": drives_data,
            "students": students,
            "applications": active_apps,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("University analytics failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch analytics")
