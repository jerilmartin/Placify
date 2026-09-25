"""Shared recruiter/student schedule for real interviews, separate from mock practice."""

import logging
import uuid
from datetime import datetime, timezone
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException

from app.database import get_supabase
from app.middleware.auth import require_recruiter, require_student
from app.models.interview_appointment import AppointmentCreate, AppointmentUpdate
from app.routers.notifications import send_notification

logger = logging.getLogger(__name__)
router = APIRouter()


def _database_error(error: Exception):
    if "23505" in str(error):
        raise HTTPException(status_code=409, detail="This application already has a scheduled interview") from error
    if "42P01" in str(error) or "PGRST205" in str(error) or ("interview_appointments" in str(error) and "schema cache" in str(error).lower()):
        raise HTTPException(status_code=503, detail="Interview scheduling is not installed. Apply supabase/migrations/interview_appointments.sql.") from error
    logger.exception("Interview appointment database error")
    raise HTTPException(status_code=500, detail="Could not process interview appointment") from error


def _student_user_id(supabase, student_id: str) -> str:
    rows = supabase.table("student_profiles").select("user_id").eq("id", student_id).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return rows[0]["user_id"]


def _candidate_context(supabase, kind: str, application_id: uuid.UUID, recruiter_user_id: str):
    if kind == "job":
        rows = supabase.table("applications").select("id,student_id,job_id,status").eq("id", str(application_id)).limit(1).execute().data or []
        if not rows or rows[0]["status"] in ("rejected", "withdrawn"):
            raise HTTPException(status_code=404, detail="Active job application not found")
        application = rows[0]
        jobs = supabase.table("jobs").select("title,company").eq("id", application["job_id"]).eq("recruiter_id", recruiter_user_id).limit(1).execute().data or []
        if not jobs:
            raise HTTPException(status_code=404, detail="Job application is not owned by your recruiter account")
        return application["student_id"], jobs[0]["company"], jobs[0]["title"], "job_application_id"

    rows = supabase.table("drive_applications").select("id,student_id,drive_id,status").eq("id", str(application_id)).limit(1).execute().data or []
    if not rows or rows[0]["status"] == "rejected":
        raise HTTPException(status_code=404, detail="Active drive application not found")
    application = rows[0]
    recruiter = supabase.table("recruiter_profiles").select("id").eq("user_id", recruiter_user_id).limit(1).execute().data or []
    if not recruiter:
        raise HTTPException(status_code=404, detail="Recruiter profile not found")
    ownership = supabase.table("drive_requests").select("id").eq("recruiter_id", recruiter[0]["id"]).eq("placement_drive_id", application["drive_id"]).eq("status", "approved").limit(1).execute().data or []
    if not ownership:
        raise HTTPException(status_code=404, detail="Drive application is not owned by your recruiter account")
    drives = supabase.table("placement_drives").select("company_name,role,title").eq("id", application["drive_id"]).limit(1).execute().data or []
    if not drives:
        raise HTTPException(status_code=404, detail="Placement drive not found")
    drive = drives[0]
    return application["student_id"], drive["company_name"], drive.get("role") or drive["title"], "drive_application_id"


def _notify(supabase, appointment: dict, title: str, message: str):
    send_notification(
        supabase,
        user_id=_student_user_id(supabase, appointment["student_id"]),
        notif_type="interview_scheduled",
        title=title,
        message=message,
        data={"appointment_id": appointment["id"], "starts_at": appointment["starts_at"]},
    )


def _time_label(appointment: dict) -> str:
    starts_at = datetime.fromisoformat(appointment["starts_at"].replace("Z", "+00:00"))
    return starts_at.astimezone(timezone.utc).strftime("%d %b %Y at %H:%M UTC")


@router.get("/recruiter")
async def recruiter_schedule(current_user=Depends(require_recruiter)):
    supabase = get_supabase()
    try:
        return (
            supabase.table("interview_appointments")
            .select("*,student_profiles(full_name,email,university)")
            .eq("recruiter_id", str(current_user.id))
            .order("starts_at")
            .execute()
        ).data or []
    except Exception as error:
        _database_error(error)


@router.get("/student")
async def student_schedule(current_user=Depends(require_student)):
    supabase = get_supabase()
    try:
        profiles = supabase.table("student_profiles").select("id").eq("user_id", str(current_user.id)).limit(1).execute().data or []
        if not profiles:
            return []
        return (
            supabase.table("interview_appointments")
            .select("*")
            .eq("student_id", profiles[0]["id"])
            .order("starts_at")
            .execute()
        ).data or []
    except Exception as error:
        _database_error(error)


@router.post("/", status_code=201)
async def create_appointment(data: AppointmentCreate, current_user=Depends(require_recruiter)):
    supabase = get_supabase()
    try:
        kind = data.application_kind.value
        student_id, company, role, source_column = _candidate_context(supabase, kind, data.application_id, str(current_user.id))
        existing = (
            supabase.table("interview_appointments").select("id")
            .eq(source_column, str(data.application_id)).eq("status", "scheduled").limit(1).execute()
        ).data or []
        if existing:
            raise HTTPException(status_code=409, detail="This application already has a scheduled interview. Reschedule it from Interview Schedule.")
        payload = data.model_dump(mode="json", exclude={"application_kind", "application_id"})
        payload.update({
            "recruiter_id": str(current_user.id), "student_id": student_id,
            "company_name": company, "role_title": role,
            source_column: str(data.application_id), "status": "scheduled",
        })
        appointment = supabase.table("interview_appointments").insert(payload).execute().data[0]
        _notify(supabase, appointment, f"Interview scheduled · {company}", f"Your {role} interview is on {_time_label(appointment)}. Open Applications for joining details.")
        return appointment
    except HTTPException:
        raise
    except Exception as error:
        _database_error(error)


@router.put("/{appointment_id}")
async def update_appointment(appointment_id: uuid.UUID, data: AppointmentUpdate, current_user=Depends(require_recruiter)):
    supabase = get_supabase()
    try:
        rows = (
            supabase.table("interview_appointments").select("*")
            .eq("id", str(appointment_id)).eq("recruiter_id", str(current_user.id))
            .limit(1).execute()
        ).data or []
        if not rows:
            raise HTTPException(status_code=404, detail="Interview appointment not found")
        previous = rows[0]
        if previous["status"] != "scheduled":
            raise HTTPException(status_code=409, detail="Only scheduled interviews can be changed")
        changes = data.model_dump(mode="json", exclude_unset=True)
        if not changes:
            raise HTTPException(status_code=400, detail="No appointment changes supplied")
        if any(field in changes and changes[field] is None for field in ("starts_at", "duration_minutes", "round_name", "meeting_mode", "status")):
            raise HTTPException(status_code=400, detail="Required appointment fields cannot be cleared")
        if changes.get("status") == "scheduled":
            raise HTTPException(status_code=400, detail="Use reschedule fields to update a scheduled interview")
        merged = {**previous, **changes}
        if merged["status"] == "scheduled":
            starts_at = datetime.fromisoformat(merged["starts_at"].replace("Z", "+00:00"))
            if starts_at <= datetime.now(timezone.utc):
                raise HTTPException(status_code=400, detail="Interview time must be in the future")
            if merged["meeting_mode"] == "online":
                parsed = urlparse(str(merged.get("meeting_url") or ""))
                if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
                    raise HTTPException(status_code=400, detail="An online interview needs a valid HTTPS meeting link")
            if merged["meeting_mode"] == "in_person" and not str(merged.get("location") or "").strip():
                raise HTTPException(status_code=400, detail="An in-person interview needs a location")
        changes["updated_at"] = datetime.now(timezone.utc).isoformat()
        appointment = (
            supabase.table("interview_appointments").update(changes)
            .eq("id", str(appointment_id)).eq("recruiter_id", str(current_user.id))
            .execute()
        ).data[0]
        if appointment["status"] == "cancelled":
            _notify(supabase, appointment, f"Interview cancelled · {appointment['company_name']}", "Your interview was cancelled. Open Applications for the latest status.")
        elif appointment["status"] == "completed":
            source_table = "applications" if appointment.get("job_application_id") else "drive_applications"
            source_id = appointment.get("job_application_id") or appointment.get("drive_application_id")
            try:
                application_rows = supabase.table(source_table).select("status").eq("id", source_id).eq("student_id", appointment["student_id"]).limit(1).execute().data or []
                if application_rows and application_rows[0]["status"] in ("submitted", "reviewed", "shortlisted", "registered", "eligible"):
                    supabase.table(source_table).update({"status": "interviewed"}).eq("id", source_id).eq("student_id", appointment["student_id"]).execute()
            except Exception:
                logger.exception("Interview completed, but application stage could not be updated")
        else:
            _notify(supabase, appointment, f"Interview updated · {appointment['company_name']}", f"Your interview is now on {_time_label(appointment)}. Open Applications for joining details.")
        return appointment
    except HTTPException:
        raise
    except Exception as error:
        _database_error(error)
