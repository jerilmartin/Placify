"""
AI Feature router — Gemini-powered features accessible from the frontend
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.middleware.auth import require_student
from app.database import get_supabase
from app.services.gemini_service import (
    career_guidance_chat,
    analyze_resume_vs_job,
    predict_placement_risk,
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class CareerGuidanceRequest(BaseModel):
    message: str
    conversation_history: list = []


class ResumeJobAnalysisRequest(BaseModel):
    resume_id: str
    job_id: str


class PlacementRiskRequest(BaseModel):
    student_id: Optional[str] = None  # If None, uses current user's profile


def _ensure_historical_placement_model(supabase) -> None:
    """Train once from completed application outcomes when enough data exists."""
    from ml.placement_predictor import get_predictor
    import numpy as np

    predictor = get_predictor()
    if predictor.is_ready():
        return

    profiles = supabase.table("student_profiles").select(
        "id,skills,cgpa,projects,work_experience,profile_completion,github_url,linkedin_url,active_backlogs"
    ).execute().data or []
    applications = supabase.table("applications").select("student_id,status").execute().data or []
    drive_applications = supabase.table("drive_applications").select("student_id,status").execute().data or []
    interviews = supabase.table("interviews").select("student_id,feedback").eq("status", "completed").execute().data or []

    outcomes = {}
    positive = {"offered", "accepted", "selected", "placed"}
    negative = {"rejected"}
    for application in [*applications, *drive_applications]:
        status = (application.get("status") or "").lower()
        student_id = application.get("student_id")
        if student_id and status in positive:
            outcomes[student_id] = 1
        elif student_id and status in negative and student_id not in outcomes:
            outcomes[student_id] = 0

    interview_scores = {}
    for interview in interviews:
        feedback = interview.get("feedback") or {}
        score = feedback.get("overall_score") if isinstance(feedback, dict) else None
        if score is not None:
            interview_scores.setdefault(interview.get("student_id"), []).append(float(score))

    labeled = []
    labels = []
    for profile in profiles:
        if profile["id"] not in outcomes:
            continue
        scores = interview_scores.get(profile["id"], [])
        profile["mock_interview_score"] = sum(scores) / len(scores) if scores else 0
        labeled.append(predictor.extract_features(profile))
        labels.append(outcomes[profile["id"]])

    if len(labeled) >= 20 and len(set(labels)) == 2:
        predictor.train(np.asarray(labeled, dtype=float), np.asarray(labels, dtype=int))
        logger.info("Placement predictor trained from %s historical outcomes", len(labeled))
    else:
        logger.info("Historical placement model needs at least 20 mixed outcomes; found %s", len(labeled))


@router.post("/career-guidance")
async def career_guidance(request: CareerGuidanceRequest, current_user=Depends(require_student)):
    """
    AI Career Guidance Chatbot.
    Ask: "What skills should I learn for Data Science?"
    Gemini responds as a career mentor.
    """
    try:
        supabase = get_supabase()
        profile_res = supabase.table("student_profiles").select("*").eq("user_id", str(current_user.id)).limit(1).execute()
        student_context = profile_res.data[0] if profile_res.data else {}

        # Enrich with real drive application history
        if student_context.get("id"):
            try:
                apps_res = supabase.table("drive_applications") \
                    .select("status, placement_drives(company_name, role)") \
                    .eq("student_id", student_context["id"]) \
                    .limit(5) \
                    .execute()
                if apps_res.data:
                    student_context["applied_drives"] = [
                        f"{a.get('placement_drives', {}).get('role') or 'Role'} at {a.get('placement_drives', {}).get('company_name') or 'Company'} ({a.get('status')})"
                        for a in apps_res.data if a.get("placement_drives")
                    ]
            except Exception:
                pass

            # Enrich with interview history
            try:
                interviews_res = supabase.table("interviews") \
                    .select("interview_type, feedback") \
                    .eq("student_id", student_context["id"]) \
                    .eq("status", "completed") \
                    .limit(3) \
                    .execute()
                if interviews_res.data:
                    scores = [
                        i.get("feedback", {}).get("overall_score")
                        for i in interviews_res.data
                        if i.get("feedback") and isinstance(i.get("feedback"), dict) and i["feedback"].get("overall_score")
                    ]
                    if scores:
                        student_context["avg_interview_score"] = round(sum(scores) / len(scores))
            except Exception:
                pass

        response = await career_guidance_chat(
            message=request.message,
            history=request.conversation_history,
            student_context=student_context,
        )
        return {"response": response, "role": "assistant"}
    except Exception as e:
        logger.error(f"Career guidance error: {e}")
        raise HTTPException(status_code=500, detail="Career guidance unavailable")


@router.post("/resume-vs-job")
async def resume_vs_job_analysis(request: ResumeJobAnalysisRequest, current_user=Depends(require_student)):
    """
    AI Resume vs Job Analysis.
    Returns: missing skills, match %, recommendations, cover letter tips.
    """
    supabase = get_supabase()
    try:
        profile = supabase.table("student_profiles").select("id") \
            .eq("user_id", str(current_user.id)).limit(1).execute()
        if not profile.data:
            raise HTTPException(status_code=404, detail="Student profile not found")
        resume_res = supabase.table("resumes").select("*") \
            .eq("id", request.resume_id) \
            .eq("student_id", profile.data[0]["id"]) \
            .limit(1).execute()
        if not resume_res.data:
            raise HTTPException(status_code=404, detail="Resume not found")
        resume = resume_res.data[0]

        job_data = None
        job_res = supabase.table("jobs").select("*").eq("id", request.job_id).limit(1).execute()
        if job_res.data and len(job_res.data) > 0:
            job_data = job_res.data[0]
        else:
            drive_res = supabase.table("placement_drives").select("*").eq("id", request.job_id).limit(1).execute()
            if drive_res.data and len(drive_res.data) > 0:
                drive = drive_res.data[0]
                eligibility = drive.get("eligibility") or drive.get("eligibility_criteria") or {}
                skills = eligibility.get("required_skills") or eligibility.get("eligible_branches") or []
                job_data = {
                    "id": drive.get("id"),
                    "title": drive.get("role") or drive.get("title") or "Software Engineer",
                    "company": drive.get("company_name") or "Company",
                    "description": drive.get("description") or f"Campus placement drive for {drive.get('company_name')}",
                    "skills_required": skills if isinstance(skills, list) else [str(skills)],
                }

        if not job_data:
            raise HTTPException(status_code=404, detail="Job or placement drive not found")

        analysis = await analyze_resume_vs_job(
            resume_text=resume.get("parsed_text", ""),
            resume_data=resume.get("extracted_data", {}),
            job=job_data,
        )
        return analysis
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resume vs job analysis error: {e}")
        raise HTTPException(status_code=500, detail="Analysis failed")


@router.get("/placement-risk")
async def placement_risk(current_user=Depends(require_student)):
    """
    Predict placement probability for current student.
    Uses ML model (Scikit-Learn) + profile data.
    Returns: risk_level (Low/Medium/High), probability %, improvement tips.
    """
    supabase = get_supabase()
    try:
        profile = supabase.table("student_profiles").select("*").eq("user_id", str(current_user.id)).single().execute()
        if not profile.data:
            raise HTTPException(status_code=404, detail="Complete your profile first")
        profile_data = profile.data
        interviews = supabase.table("interviews").select("feedback") \
            .eq("student_id", profile_data["id"]).eq("status", "completed").execute()
        scores = [
            item.get("feedback", {}).get("overall_score")
            for item in (interviews.data or [])
            if isinstance(item.get("feedback"), dict) and item.get("feedback", {}).get("overall_score") is not None
        ]
        profile_data["mock_interview_score"] = sum(scores) / len(scores) if scores else 0
        try:
            _ensure_historical_placement_model(supabase)
        except Exception as exc:
            logger.warning("Historical placement training unavailable; using fallback: %s", exc)
        prediction = await predict_placement_risk(profile_data)
        return prediction
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Prediction failed")


@router.get("/profile-strength")
async def profile_strength(current_user=Depends(require_student)):
    """
    Get detailed profile strength breakdown (like LinkedIn).
    Returns score for each section + tips to improve.
    """
    from app.services.scoring_service import get_profile_strength_breakdown
    supabase = get_supabase()
    try:
        profile = supabase.table("student_profiles").select("*").eq("user_id", str(current_user.id)).single().execute()
        if not profile.data:
            raise HTTPException(status_code=404, detail="Profile not found")

        breakdown = get_profile_strength_breakdown(profile.data)
        return breakdown
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to compute profile strength")
