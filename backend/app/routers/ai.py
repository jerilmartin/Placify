"""
AI Feature router — Gemini-powered features accessible from the frontend
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.middleware.auth import get_current_user
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


@router.post("/career-guidance")
async def career_guidance(request: CareerGuidanceRequest, current_user=Depends(get_current_user)):
    """
    AI Career Guidance Chatbot.
    Ask: "What skills should I learn for Data Science?"
    Gemini responds as a career mentor.
    """
    try:
        supabase = get_supabase()
        profile = supabase.table("student_profiles").select("*").eq("user_id", str(current_user.id)).single().execute()
        student_context = profile.data if profile.data else {}

        response = await career_guidance_chat(
            message=request.message,
            history=request.conversation_history,
            student_context=student_context,
        )
        return {"response": response, "role": "assistant"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Career guidance unavailable")


@router.post("/resume-vs-job")
async def resume_vs_job_analysis(request: ResumeJobAnalysisRequest, current_user=Depends(get_current_user)):
    """
    AI Resume vs Job Analysis.
    Returns: missing skills, match %, recommendations, cover letter tips.
    """
    supabase = get_supabase()
    try:
        resume = supabase.table("resumes").select("*").eq("id", request.resume_id).single().execute()
        job = supabase.table("jobs").select("*").eq("id", request.job_id).single().execute()

        if not resume.data or not job.data:
            raise HTTPException(status_code=404, detail="Resume or job not found")

        analysis = await analyze_resume_vs_job(
            resume_text=resume.data.get("parsed_text", ""),
            resume_data=resume.data.get("extracted_data", {}),
            job=job.data,
        )
        return analysis
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Analysis failed")


@router.get("/placement-risk")
async def placement_risk(current_user=Depends(get_current_user)):
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

        prediction = await predict_placement_risk(profile.data)
        return prediction
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Prediction failed")


@router.get("/profile-strength")
async def profile_strength(current_user=Depends(get_current_user)):
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
