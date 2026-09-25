"""Student applications and recruiter pipeline endpoints."""

from datetime import date
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.database import get_supabase
from app.middleware.auth import require_recruiter, require_student
from app.models.application import ApplicationCreate, ApplicationResponse, ApplicationUpdate
from app.services.eligibility_service import matches_branch

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=list[ApplicationResponse])
async def list_my_applications(current_user=Depends(require_student)):
    """List all direct-job applications for the current student."""
    supabase = get_supabase()
    try:
        profile = (
            supabase.table("student_profiles")
            .select("id")
            .eq("user_id", str(current_user.id))
            .limit(1)
            .execute()
        )
        if not profile.data:
            return []
        try:
            result = (
                supabase.table("applications")
                .select("*, jobs(title,company,location,package_lpa)")
                .eq("student_id", profile.data[0]["id"])
                .order("created_at", desc=True)
                .execute()
            )
            return result.data or []
        except Exception:
            result = (
                supabase.table("applications")
                .select("*, jobs(title,company,location,package_lpa)")
                .eq("student_id", profile.data[0]["id"])
                .execute()
            )
            return result.data or []
    except Exception as exc:
        logger.error("Error fetching student applications: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to fetch applications") from exc


@router.post("/", response_model=ApplicationResponse, status_code=201)
async def apply_to_job(data: ApplicationCreate, current_user=Depends(require_student)):
    """Apply to an active job after enforcing its declared eligibility."""
    supabase = get_supabase()
    try:
        profile_result = (
            supabase.table("student_profiles")
            .select("id,cgpa,course,university_id")
            .eq("user_id", str(current_user.id))
            .limit(1)
            .execute()
        )
        if not profile_result.data:
            raise HTTPException(status_code=404, detail="Complete your profile first")
        profile = profile_result.data[0]

        job_result = (
            supabase.table("jobs")
            .select("*")
            .eq("id", str(data.job_id))
            .limit(1)
            .execute()
        )
        if not job_result.data or job_result.data[0].get("status") != "active":
            raise HTTPException(status_code=404, detail="Active job not found")
        job = job_result.data[0]
        if job.get("university_id") and job["university_id"] != profile.get("university_id"):
            raise HTTPException(status_code=403, detail="This job is for another university")
        if job.get("deadline") and date.fromisoformat(job["deadline"]) < date.today():
            raise HTTPException(status_code=400, detail="The application deadline has passed")
        if job.get("min_cgpa") is not None and float(profile.get("cgpa") or 0) < float(job["min_cgpa"]):
            raise HTTPException(
                status_code=400,
                detail="Your CGPA does not meet this job's eligibility requirement",
            )
        eligible_branches = job.get("eligible_branches") or []
        course = profile.get("course") or ""
        if eligible_branches and not any(matches_branch(course, b) for b in eligible_branches):
            raise HTTPException(
                status_code=400,
                detail=f"Your course ({course}) does not meet this job's branch requirement (Allowed: {', '.join(eligible_branches)})",
            )

        existing = (
            supabase.table("applications")
            .select("id")
            .eq("student_id", profile["id"])
            .eq("job_id", str(data.job_id))
            .limit(1)
            .execute()
        )
        if existing.data:
            raise HTTPException(status_code=409, detail="Already applied to this job")

        result = supabase.table("applications").insert(
            {
                "student_id": profile["id"],
                "job_id": str(data.job_id),
                "cover_letter": data.cover_letter,
                "status": "submitted",
            }
        ).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Application creation returned no data")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error submitting application: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to submit application") from exc


@router.get("/job/{job_id}", response_model=list[ApplicationResponse])
async def list_applications_for_job(
    job_id: uuid.UUID,
    current_user=Depends(require_recruiter),
):
    """List applications only when the authenticated recruiter owns the job."""
    supabase = get_supabase()
    try:
        owned_job = (
            supabase.table("jobs")
            .select("id")
            .eq("id", str(job_id))
            .eq("recruiter_id", str(current_user.id))
            .limit(1)
            .execute()
        )
        if not owned_job.data:
            raise HTTPException(
                status_code=404,
                detail="Job not found or not owned by this recruiter",
            )
        result = (
            supabase.table("applications")
            .select("*, student_profiles(full_name,email,cgpa,skills)")
            .eq("job_id", str(job_id))
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Failed to fetch applications for job %s: %s", job_id, exc)
        raise HTTPException(status_code=500, detail="Failed to fetch applications") from exc


@router.put("/{application_id}", response_model=ApplicationResponse)
async def update_application_status(
    application_id: uuid.UUID,
    data: ApplicationUpdate,
    current_user=Depends(require_recruiter),
):
    """Move a candidate through a recruiter-owned job pipeline."""
    supabase = get_supabase()
    try:
        application_result = (
            supabase.table("applications")
            .select("id,job_id")
            .eq("id", str(application_id))
            .limit(1)
            .execute()
        )
        if not application_result.data:
            raise HTTPException(status_code=404, detail="Application not found")
        application = application_result.data[0]
        owned_job = (
            supabase.table("jobs")
            .select("id")
            .eq("id", application["job_id"])
            .eq("recruiter_id", str(current_user.id))
            .limit(1)
            .execute()
        )
        if not owned_job.data:
            raise HTTPException(
                status_code=404,
                detail="Application not found or not owned by this recruiter",
            )
        update_data = data.model_dump(exclude_none=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No application fields supplied")
        result = (
            supabase.table("applications")
            .update(update_data)
            .eq("id", str(application_id))
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Application not found")

        # Dispatch notification to the candidate
        try:
            student_id = application.get("student_id")
            job_id = application.get("job_id")
            if not student_id:
                app_detail = supabase.table("applications").select("student_id,job_id").eq("id", str(application_id)).limit(1).execute()
                if app_detail.data:
                    student_id = app_detail.data[0].get("student_id")
                    job_id = app_detail.data[0].get("job_id")

            student_res = supabase.table("student_profiles").select("user_id").eq("id", student_id).limit(1).execute()
            job_res = supabase.table("jobs").select("title,company").eq("id", str(job_id)).limit(1).execute()

            if student_res.data and student_res.data[0].get("user_id"):
                student_user_id = student_res.data[0]["user_id"]
                j_info = job_res.data[0] if job_res.data else {}
                title = j_info.get("title", "Role")
                company = j_info.get("company", "Company")

                status_val = update_data.get("status", "updated")
                if status_val == "shortlisted":
                    n_title = f"Shortlisted for {title}! 🎉"
                    n_msg = f"Congratulations! You have been shortlisted by {company} for {title}."
                    n_type = "application_update"
                elif status_val == "interviewed":
                    n_title = f"Interview Scheduled: {company} 📅"
                    n_msg = f"You have been invited for an interview with {company} for {title}."
                    n_type = "interview_scheduled"
                elif status_val in ("offered", "accepted"):
                    n_title = f"Offer Received from {company}! 🏆"
                    n_msg = f"Congratulations! You received an offer for {title} at {company}."
                    n_type = "offer_received"
                elif status_val == "rejected":
                    n_title = f"Application Status: {company}"
                    n_msg = f"Your application for {title} was not selected at this time."
                    n_type = "application_update"
                else:
                    n_title = f"Application Status: {status_val.capitalize()}"
                    n_msg = f"Your application for {title} at {company} is now {status_val}."
                    n_type = "application_update"

                from app.routers.notifications import send_notification
                send_notification(
                    supabase,
                    user_id=student_user_id,
                    notif_type=n_type,
                    title=n_title,
                    message=n_msg,
                    data={"application_id": str(application_id), "job_id": str(job_id), "status": status_val},
                )
        except Exception as notify_err:
            logger.warning(f"Failed to dispatch application status notification: {notify_err}")

        return result.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Failed to update application %s: %s", application_id, exc)
        raise HTTPException(status_code=500, detail="Failed to update application") from exc


@router.delete("/{application_id}")
async def withdraw_application(
    application_id: uuid.UUID,
    current_user=Depends(require_student),
):
    """Allow a student to withdraw only their own application."""
    supabase = get_supabase()
    profile = (
        supabase.table("student_profiles")
        .select("id")
        .eq("user_id", str(current_user.id))
        .limit(1)
        .execute()
    )
    if not profile.data:
        raise HTTPException(status_code=404, detail="Student profile not found")
    result = (
        supabase.table("applications")
        .update({"status": "withdrawn"})
        .eq("id", str(application_id))
        .eq("student_id", profile.data[0]["id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Application withdrawn"}
