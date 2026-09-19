"""Recruiter profile, hiring pipeline, and analytics endpoints."""

from collections import Counter
from datetime import date, datetime, timezone
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Literal, Optional

from app.database import get_supabase
from app.middleware.auth import require_recruiter
from app.models.recruiter import (
    RecruiterProfileCreate,
    RecruiterProfileResponse,
    RecruiterProfileUpdate,
)
from app.models.drive_request import DriveRequestCreate, DriveRequestResubmit
from app.services.gemini_service import recruiter_ai_search

logger = logging.getLogger(__name__)
router = APIRouter()


class DriveApplicationUpdate(BaseModel):
    status: Literal["registered", "eligible", "shortlisted", "interviewed", "selected", "rejected"]


def _profile_for_user(supabase, user_id: str) -> dict:
    result = (
        supabase.table("recruiter_profiles")
        .select("*")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Recruiter profile not found")
    return result.data[0]


def _owned_job(supabase, job_id: uuid.UUID, user_id: str) -> dict:
    result = (
        supabase.table("jobs")
        .select("*")
        .eq("id", str(job_id))
        .eq("recruiter_id", user_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found or not owned by this recruiter")
    return result.data[0]


@router.get("/profile", response_model=RecruiterProfileResponse)
async def get_my_recruiter_profile(current_user=Depends(require_recruiter)):
    return _profile_for_user(get_supabase(), str(current_user.id))


@router.post("/profile", response_model=RecruiterProfileResponse, status_code=201)
async def create_recruiter_profile(
    data: RecruiterProfileCreate,
    current_user=Depends(require_recruiter),
):
    supabase = get_supabase()
    user_id = str(current_user.id)
    existing = (
        supabase.table("recruiter_profiles")
        .select("id")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=409, detail="Recruiter profile already exists")

    payload = data.model_dump(exclude_none=True)
    payload["user_id"] = user_id
    result = supabase.table("recruiter_profiles").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Profile creation returned no data")
    return result.data[0]


@router.put("/profile", response_model=RecruiterProfileResponse)
async def update_recruiter_profile(
    data: RecruiterProfileUpdate,
    current_user=Depends(require_recruiter),
):
    supabase = get_supabase()
    user_id = str(current_user.id)
    _profile_for_user(supabase, user_id)
    update_data = data.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No profile fields supplied")
    result = (
        supabase.table("recruiter_profiles")
        .update(update_data)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Recruiter profile not found")
    return result.data[0]


@router.get("/jobs")
async def list_my_jobs(current_user=Depends(require_recruiter)):
    """Return active, draft, and closed jobs owned by the current recruiter."""
    supabase = get_supabase()
    result = (
        supabase.table("jobs")
        .select("*")
        .eq("recruiter_id", str(current_user.id))
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.get("/universities")
async def list_available_universities(current_user=Depends(require_recruiter)):
    """Return verified universities that can receive campus-drive proposals."""
    result = (
        get_supabase().table("university_profiles")
        .select("id,name,location,website,verified")
        .eq("verified", True)
        .order("name")
        .execute()
    )
    return result.data or []


@router.get("/drive-requests")
async def list_my_drive_requests(current_user=Depends(require_recruiter)):
    """List this recruiter's campus-drive proposals and review outcomes."""
    supabase = get_supabase()
    profile = _profile_for_user(supabase, str(current_user.id))
    result = (
        supabase.table("drive_requests")
        .select(
            "*, university_profiles(id,name,location), "
            "placement_drives(id,status,created_at)"
        )
        .eq("recruiter_id", profile["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.post("/drive-requests", status_code=201)
async def create_drive_request(
    data: DriveRequestCreate,
    current_user=Depends(require_recruiter),
):
    """Submit a campus-drive proposal to one verified university."""
    supabase = get_supabase()
    profile = _profile_for_user(supabase, str(current_user.id))
    if not profile.get("verified"):
        raise HTTPException(
            status_code=403,
            detail="Recruiter verification is required before requesting campus drives",
        )
    university = (
        supabase.table("university_profiles")
        .select("id,verified")
        .eq("id", str(data.university_id))
        .eq("verified", True)
        .limit(1)
        .execute()
    )
    if not university.data:
        raise HTTPException(status_code=404, detail="Verified university not found")

    payload = data.model_dump(mode="json")
    payload.update(
        {
            "recruiter_id": profile["id"],
            "company_name": profile["company_name"],
            "status": "pending",
        }
    )
    result = supabase.table("drive_requests").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Drive request creation returned no data")
    return result.data[0]


@router.put("/drive-requests/{request_id}/resubmit")
async def resubmit_drive_request(
    request_id: uuid.UUID,
    data: DriveRequestResubmit,
    current_user=Depends(require_recruiter),
):
    """Apply requested corrections and send the proposal back for review."""
    supabase = get_supabase()
    profile = _profile_for_user(supabase, str(current_user.id))
    existing = (
        supabase.table("drive_requests")
        .select("*")
        .eq("id", str(request_id))
        .eq("recruiter_id", profile["id"])
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Drive request not found")
    request = existing.data[0]
    if request.get("status") != "changes_requested":
        raise HTTPException(
            status_code=409,
            detail="Only requests with changes requested can be resubmitted",
        )

    update_data = data.model_dump(mode="json", exclude_none=True)
    merged_drive_date = update_data.get("drive_date") or request.get("drive_date")
    merged_deadline = (
        update_data.get("registration_deadline")
        or request.get("registration_deadline")
    )
    if (
        merged_drive_date
        and merged_deadline
        and date.fromisoformat(merged_deadline) > date.fromisoformat(merged_drive_date)
    ):
        raise HTTPException(
            status_code=422,
            detail="Registration deadline must be on or before the drive date",
        )
    if not update_data:
        raise HTTPException(status_code=400, detail="No drive request fields supplied")
    update_data.update(
        {
            "status": "pending",
            "review_notes": None,
            "reviewed_by": None,
            "reviewed_at": None,
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    result = (
        supabase.table("drive_requests")
        .update(update_data)
        .eq("id", str(request_id))
        .eq("recruiter_id", profile["id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Drive request resubmission failed")
    return result.data[0]


@router.delete("/drive-requests/{request_id}")
async def cancel_drive_request(
    request_id: uuid.UUID,
    current_user=Depends(require_recruiter),
):
    """Cancel a request that has not reached an approval decision."""
    supabase = get_supabase()
    profile = _profile_for_user(supabase, str(current_user.id))
    existing = (
        supabase.table("drive_requests")
        .select("id,status")
        .eq("id", str(request_id))
        .eq("recruiter_id", profile["id"])
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Drive request not found")
    if existing.data[0]["status"] not in {"pending", "changes_requested"}:
        raise HTTPException(status_code=409, detail="This drive request can no longer be cancelled")
    result = (
        supabase.table("drive_requests")
        .update(
            {
                "status": "cancelled",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        .eq("id", str(request_id))
        .execute()
    )
    return result.data[0]


@router.get("/overview")
async def recruiter_overview(current_user=Depends(require_recruiter)):
    """Aggregate a recruiter-owned hiring funnel for dashboards and analytics."""
    supabase = get_supabase()
    user_id = str(current_user.id)
    profile = _profile_for_user(supabase, user_id)
    jobs = (
        supabase.table("jobs")
        .select("*")
        .eq("recruiter_id", user_id)
        .order("created_at", desc=True)
        .execute()
    ).data or []
    job_ids = [job["id"] for job in jobs]

    applications = []
    if job_ids:
        applications = (
            supabase.table("applications")
            .select("*, student_profiles(full_name,email,university,course,cgpa,skills)")
            .in_("job_id", job_ids)
            .order("created_at", desc=True)
            .execute()
        ).data or []

    approved_requests = (
        supabase.table("drive_requests")
        .select("placement_drive_id")
        .eq("recruiter_id", profile["id"])
        .eq("status", "approved")
        .not_.is_("placement_drive_id", "null")
        .execute()
    ).data or []
    drive_ids = [req["placement_drive_id"] for req in approved_requests if req.get("placement_drive_id")]

    drive_applications = []
    if drive_ids:
        drive_applications = (
            supabase.table("drive_applications")
            .select("*, student_profiles(full_name,email,university,course,cgpa,skills)")
            .in_("drive_id", drive_ids)
            .order("registered_at", desc=True)
            .execute()
        ).data or []

    all_applications = applications + drive_applications
    all_applications.sort(
        key=lambda x: x.get("created_at") or x.get("registered_at") or "",
        reverse=True,
    )

    status_counts = Counter(application.get("status", "submitted") for application in all_applications)
    recent = all_applications[:5]
    return {
        "profile": profile,
        "jobs": jobs,
        "recent_applications": recent,
        "metrics": {
            "total_jobs": len(jobs),
            "open_jobs": sum(job.get("status") == "active" for job in jobs),
            "applications": len(all_applications),
            "reviewed": status_counts["reviewed"],
            "shortlisted": status_counts["shortlisted"],
            "interviewed": status_counts["interviewed"],
            "offers": status_counts["offered"] + status_counts["accepted"],
            "accepted": status_counts["accepted"],
            "rejected": status_counts["rejected"],
        },
        "funnel": [
            {"stage": "Applied", "count": len(all_applications)},
            {
                "stage": "Reviewed",
                "count": sum(
                    status_counts[name]
                    for name in ("reviewed", "shortlisted", "interviewed", "offered", "accepted")
                ),
            },
            {
                "stage": "Shortlisted",
                "count": sum(
                    status_counts[name]
                    for name in ("shortlisted", "interviewed", "offered", "accepted")
                ),
            },
            {
                "stage": "Interview",
                "count": sum(
                    status_counts[name] for name in ("interviewed", "offered", "accepted")
                ),
            },
            {"stage": "Offer", "count": status_counts["offered"] + status_counts["accepted"]},
        ],
    }


@router.get("/candidates")
async def get_ai_sorted_candidates(
    job_id: Optional[uuid.UUID] = None,
    drive_id: Optional[uuid.UUID] = None,
    current_user=Depends(require_recruiter),
):
    """Return applicants for one owned direct job or approved campus drive."""
    supabase = get_supabase()
    user_id = str(current_user.id)

    if bool(job_id) == bool(drive_id):
        raise HTTPException(status_code=422, detail="Provide exactly one of job_id or drive_id")

    if drive_id:
        recruiter = _profile_for_user(supabase, user_id)
        approved_request = (
            supabase.table("drive_requests")
            .select("id,placement_drive_id")
            .eq("recruiter_id", recruiter["id"])
            .eq("placement_drive_id", str(drive_id))
            .eq("status", "approved")
            .limit(1)
            .execute()
        )
        if not approved_request.data:
            raise HTTPException(status_code=404, detail="Approved campus drive not found for this recruiter")
        drive_result = (
            supabase.table("placement_drives").select("*")
            .eq("id", str(drive_id)).limit(1).execute()
        )
        if not drive_result.data:
            raise HTTPException(status_code=404, detail="Placement drive not found")
        drive = drive_result.data[0]
        applications = (
            supabase.table("drive_applications")
            .select(
                "*, student_profiles("
                "id,full_name,email,phone,university,course,graduation_year,cgpa,"
                "skills,github_url,linkedin_url,portfolio_url,projects,work_experience"
                ")"
            )
            .eq("drive_id", str(drive_id))
            .order("registered_at", desc=True)
            .execute()
        ).data or []
        minimum_cgpa = float((drive.get("eligibility") or {}).get("min_cgpa") or 0)
        candidates = []
        for application in applications:
            student = application.get("student_profiles") or {}
            cgpa = float(student.get("cgpa") or 0)
            score = round(min(100, 60 + (40 if not minimum_cgpa or cgpa >= minimum_cgpa else 0)))
            candidates.append({
                **application,
                "source_type": "drive",
                "drive": drive,
                "match_score": score,
                "match_reason": "Meets the campus-drive eligibility criteria",
                "skill_matches": [],
                "missing_skills": [],
            })
        return sorted(candidates, key=lambda candidate: candidate["match_score"], reverse=True)

    job = _owned_job(supabase, job_id, user_id)
    applications = (
        supabase.table("applications")
        .select(
            "*, student_profiles("
            "id,full_name,email,phone,university,course,graduation_year,cgpa,"
            "skills,github_url,linkedin_url,portfolio_url,projects,work_experience"
            ")"
        )
        .eq("job_id", str(job_id))
        .order("created_at", desc=True)
        .execute()
    ).data or []

    matches = (
        supabase.table("job_matches")
        .select("student_id,match_score,match_reason,skill_matches,missing_skills,recommendation")
        .eq("job_id", str(job_id))
        .execute()
    ).data or []
    matches_by_student = {match["student_id"]: match for match in matches}
    required_skills = {skill.lower() for skill in (job.get("skills_required") or [])}
    minimum_cgpa = float(job.get("min_cgpa") or 0)

    candidates = []
    for application in applications:
        student = application.get("student_profiles") or {}
        stored_match = matches_by_student.get(application.get("student_id"))
        student_skills = {skill.lower() for skill in (student.get("skills") or [])}
        matching_skills = sorted(required_skills & student_skills)
        missing_skills = sorted(required_skills - student_skills)
        if stored_match:
            match_score = stored_match.get("match_score") or 0
        else:
            skill_score = (
                len(matching_skills) / len(required_skills) * 75 if required_skills else 50
            )
            cgpa = float(student.get("cgpa") or 0)
            cgpa_score = 25 if not minimum_cgpa or cgpa >= minimum_cgpa else 0
            match_score = round(min(100, skill_score + cgpa_score))

        candidates.append(
            {
                **application,
                "job": job,
                "match_score": match_score,
                "match_reason": (stored_match or {}).get("match_reason"),
                "skill_matches": (stored_match or {}).get("skill_matches") or matching_skills,
                "missing_skills": (stored_match or {}).get("missing_skills") or missing_skills,
                "recommendation": (stored_match or {}).get("recommendation"),
            }
        )

    return sorted(candidates, key=lambda candidate: candidate["match_score"], reverse=True)


@router.get("/candidate-sources")
async def list_candidate_sources(current_user=Depends(require_recruiter)):
    """List direct jobs and approved campus drives that can have applicants."""
    supabase = get_supabase()
    user_id = str(current_user.id)
    recruiter = _profile_for_user(supabase, user_id)
    jobs = (
        supabase.table("jobs").select("id,title,company,status,created_at")
        .eq("recruiter_id", user_id).order("created_at", desc=True).execute()
    ).data or []
    requests = (
        supabase.table("drive_requests")
        .select("placement_drive_id,title,role,company_name,placement_drives(id,status)")
        .eq("recruiter_id", recruiter["id"]).eq("status", "approved")
        .not_.is_("placement_drive_id", "null")
        .order("created_at", desc=True).execute()
    ).data or []
    drives = [
        {
            "id": request["placement_drive_id"],
            "title": request.get("role") or request.get("title"),
            "company": request.get("company_name"),
            "status": (request.get("placement_drives") or {}).get("status"),
        }
        for request in requests if request.get("placement_drive_id")
    ]
    return {"jobs": jobs, "drives": drives}


@router.put("/drive-applications/{application_id}")
async def update_drive_application_status(
    application_id: uuid.UUID,
    data: DriveApplicationUpdate,
    current_user=Depends(require_recruiter),
):
    """Move an applicant through a recruiter-owned approved campus drive."""
    supabase = get_supabase()
    recruiter = _profile_for_user(supabase, str(current_user.id))
    application = (
        supabase.table("drive_applications").select("id,drive_id,student_id")
        .eq("id", str(application_id)).limit(1).execute()
    )
    if not application.data:
        raise HTTPException(status_code=404, detail="Campus-drive application not found")
    ownership = (
        supabase.table("drive_requests").select("id")
        .eq("recruiter_id", recruiter["id"])
        .eq("placement_drive_id", application.data[0]["drive_id"])
        .eq("status", "approved").limit(1).execute()
    )
    if not ownership.data:
        raise HTTPException(status_code=404, detail="Campus-drive application not found")
    result = (
        supabase.table("drive_applications").update({"status": data.status})
        .eq("id", str(application_id)).execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Could not update campus-drive application")

    # Dispatch notification to the candidate
    try:
        student_id = application.data[0].get("student_id")
        drive_id = application.data[0].get("drive_id")
        student_res = supabase.table("student_profiles").select("user_id,full_name").eq("id", student_id).limit(1).execute()
        drive_res = supabase.table("placement_drives").select("company_name,role,title").eq("id", drive_id).limit(1).execute()

        if student_res.data and student_res.data[0].get("user_id"):
            student_user_id = student_res.data[0]["user_id"]
            d_info = drive_res.data[0] if drive_res.data else {}
            role = d_info.get("role") or d_info.get("title") or "Placement Drive"
            company = d_info.get("company_name") or "Company"

            if data.status == "shortlisted":
                n_title = f"Shortlisted for {role}! 🎉"
                n_message = f"Congratulations! You have been shortlisted by {company} for {role}."
                n_type = "application_update"
            elif data.status == "interviewed":
                n_title = f"Interview Scheduled with {company} 📅"
                n_message = f"You have been scheduled for an interview with {company} for {role}."
                n_type = "interview_scheduled"
            elif data.status in ("selected", "offered"):
                n_title = f"Selected for {role}! 🏆"
                n_message = f"Congratulations! You have been selected by {company} for {role}."
                n_type = "offer_received"
            elif data.status == "rejected":
                n_title = f"Application Update: {company}"
                n_message = f"Your application for {role} at {company} was not selected at this time."
                n_type = "application_update"
            else:
                n_title = f"Application Status: {data.status.capitalize()}"
                n_message = f"Your status for {role} at {company} has been updated to {data.status}."
                n_type = "application_update"

            from app.routers.notifications import send_notification
            send_notification(
                supabase,
                user_id=student_user_id,
                notif_type=n_type,
                title=n_title,
                message=n_message,
                data={
                    "drive_application_id": str(application_id),
                    "drive_id": drive_id,
                    "status": data.status,
                    "company": company,
                    "role": role,
                },
            )
    except Exception as exc:
        logger.warning(f"Could not dispatch notification for drive application {application_id}: {exc}")

    return result.data[0]


@router.post("/ai-search")
async def ai_candidate_search(
    query: str,
    current_user=Depends(require_recruiter),
):
    """Translate a natural-language talent query into safe profile filters."""
    supabase = get_supabase()
    profile = _profile_for_user(supabase, str(current_user.id))
    if not profile.get("verified"):
        raise HTTPException(status_code=403, detail="Recruiter verification is required")
    try:
        return await recruiter_ai_search(query, supabase)
    except Exception as exc:
        logger.error("Recruiter AI search failed: %s", exc)
        raise HTTPException(status_code=500, detail="AI search failed") from exc
