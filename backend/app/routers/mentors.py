"""Mentors router"""

from fastapi import APIRouter, HTTPException, Depends
from app.models.mentor import (
    MentorProfileCreate, MentorProfileUpdate, MentorProfileResponse,
    MentorSessionCreate, MentorSessionResponse
)
from app.middleware.auth import get_current_user
from app.database import get_supabase
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=list[MentorProfileResponse])
async def list_mentors(current_user=Depends(get_current_user)):
    """Browse available mentors"""
    supabase = get_supabase()
    result = supabase.table("mentor_profiles").select("*").eq("verified", True).execute()
    return result.data or []


@router.get("/profile", response_model=MentorProfileResponse)
async def get_my_mentor_profile(current_user=Depends(get_current_user)):
    supabase = get_supabase()
    result = supabase.table("mentor_profiles").select("*").eq("user_id", str(current_user.id)).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Mentor profile not found")
    return result.data


@router.post("/profile", response_model=MentorProfileResponse, status_code=201)
async def create_mentor_profile(data: MentorProfileCreate, current_user=Depends(get_current_user)):
    supabase = get_supabase()
    payload = data.model_dump()
    payload["user_id"] = str(current_user.id)
    result = supabase.table("mentor_profiles").insert(payload).execute()
    return result.data[0]


@router.post("/sessions", response_model=MentorSessionResponse, status_code=201)
async def book_session(data: MentorSessionCreate, current_user=Depends(get_current_user)):
    """Book a mentoring session"""
    supabase = get_supabase()
    payload = data.model_dump()
    payload["scheduled_at"] = data.scheduled_at.isoformat()
    result = supabase.table("mentor_sessions").insert(payload).execute()
    return result.data[0]


@router.get("/sessions", response_model=list[MentorSessionResponse])
async def list_sessions(current_user=Depends(get_current_user)):
    """List sessions for current user (mentor or student)"""
    supabase = get_supabase()
    result = supabase.table("mentor_sessions") \
        .select("*") \
        .or_(f"mentor_id.eq.{current_user.id},student_id.eq.{current_user.id}") \
        .order("scheduled_at") \
        .execute()
    return result.data or []
