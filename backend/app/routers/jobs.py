"""Jobs router — CRUD + AI-powered search"""

from fastapi import APIRouter, HTTPException, Depends, Query
from app.models.job import JobCreate, JobUpdate, JobResponse, JobMatchResponse
from app.middleware.auth import get_current_user, require_recruiter, require_student
from app.database import get_supabase
from app.services.matching_service import compute_job_matches
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("", response_model=list[JobResponse])
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


@router.get("/drives")
async def list_placement_drives(current_user=Depends(require_student)):
    """
    Return all active/upcoming placement drives for the student portal.
    Uses service-role to bypass the student-university RLS match issue.
    """
    supabase = get_supabase()
    try:
        # Resolve the student's tenant before using the service-role client.
        sp_res = supabase.table("student_profiles") \
            .select("id,university_id,university") \
            .eq("user_id", str(current_user.id)) \
            .limit(1).execute()
        if not sp_res.data:
            return []
        student = sp_res.data[0]
        student_profile_id = student["id"]
        university_id = student.get("university_id")

        # Resilient university resolution: auto-link students to the university
        if not university_id:
            all_unis = (supabase.table("university_profiles").select("id,name").execute()).data or []
            stu_uni = (student.get("university") or "").strip().casefold()
            matched_uni = None
            if stu_uni:
                for u in all_unis:
                    u_name = (u.get("name") or "").strip().casefold()
                    if stu_uni in u_name or u_name in stu_uni:
                        matched_uni = u
                        break
            if not matched_uni and len(all_unis) == 1:
                matched_uni = all_unis[0]

            if matched_uni:
                university_id = matched_uni["id"]
                try:
                    supabase.table("student_profiles").update({
                        "university_id": university_id,
                        "university": matched_uni["name"],
                    }).eq("id", student_profile_id).execute()
                except Exception as ue:
                    logger.warning(f"Could not persist student university link: {ue}")

        # Query placement drives for this university
        query = supabase.table("placement_drives").select("*").in_("status", ["upcoming", "active"])
        if university_id:
            query = query.eq("university_id", university_id)
        drives_res = query.order("created_at", desc=True).execute()
        drives = drives_res.data or []

        # Get already applied drive IDs for this student
        applied_ids = set()
        if student_profile_id:
            apps_res = supabase.table("drive_applications") \
                .select("drive_id") \
                .eq("student_id", student_profile_id) \
                .execute()
            applied_ids = {a["drive_id"] for a in (apps_res.data or [])}

        # Annotate each drive with applied status
        for d in drives:
            d["already_applied"] = d["id"] in applied_ids

        return drives
    except Exception as e:
        logger.error(f"Failed to fetch placement drives: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch placement drives")



@router.get("/matches", response_model=list[JobMatchResponse])
async def get_job_matches(current_user=Depends(require_student)):
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
        job = result.data[0]
        if job.get("status") != "active" and not (
            current_user.role == "recruiter"
            and job.get("recruiter_id") == str(current_user.id)
        ):
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch job")


@router.post("/", response_model=JobResponse, status_code=201)
async def create_job(data: JobCreate, current_user=Depends(require_recruiter)):
    """Create a direct-hiring job owned by the authenticated recruiter."""
    supabase = get_supabase()
    try:
        profile = supabase.table("recruiter_profiles") \
            .select("verified").eq("user_id", str(current_user.id)).limit(1).execute()
        if not profile.data:
            raise HTTPException(status_code=404, detail="Complete your recruiter profile first")
        if not profile.data[0].get("verified"):
            raise HTTPException(status_code=403, detail="Recruiter verification is required before posting jobs")

        payload = data.model_dump(exclude_none=True)
        payload["recruiter_id"] = str(current_user.id)
        # Direct recruiter jobs are not allowed to impersonate a university drive.
        payload.pop("university_id", None)
        payload.pop("placement_drive_id", None)
        result = supabase.table("jobs").insert(payload).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Job creation returned no data")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create recruiter job: {e}")
        raise HTTPException(status_code=500, detail="Failed to create job")


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(job_id: uuid.UUID, data: JobUpdate, current_user=Depends(require_recruiter)):
    """Update job posting"""
    supabase = get_supabase()
    try:
        update_data = data.model_dump(exclude_none=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No job fields supplied")
        result = supabase.table("jobs") \
            .update(update_data) \
            .eq("id", str(job_id)) \
            .eq("recruiter_id", str(current_user.id)) \
            .execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Job not found or not owned by this recruiter")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update job {job_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update job")


@router.delete("/{job_id}")
async def delete_job(job_id: uuid.UUID, current_user=Depends(require_recruiter)):
    """Delete/close job posting"""
    supabase = get_supabase()
    result = supabase.table("jobs") \
        .update({"status": "closed"}) \
        .eq("id", str(job_id)) \
        .eq("recruiter_id", str(current_user.id)) \
        .execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found or not owned by this recruiter")
    return {"message": "Job closed successfully"}
