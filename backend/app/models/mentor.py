"""Mentor Pydantic models"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from enum import Enum
from datetime import datetime
import uuid


class SessionStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class MentorProfileBase(BaseModel):
    full_name: str
    designation: Optional[str] = None
    company: Optional[str] = None
    expertise_areas: Optional[List[str]] = []
    years_of_experience: Optional[int] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    availability: Optional[str] = None  # e.g., "Weekends, 10am-12pm"


class MentorProfileCreate(MentorProfileBase):
    user_id: uuid.UUID


class MentorProfileUpdate(MentorProfileBase):
    pass


class MentorProfileResponse(MentorProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    rating: Optional[float] = None
    total_sessions: int = 0
    verified: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MentorSessionCreate(BaseModel):
    mentor_id: uuid.UUID
    student_id: uuid.UUID
    topic: str
    scheduled_at: datetime
    duration_minutes: int = 30
    notes: Optional[str] = None
    meeting_link: Optional[str] = None


class MentorSessionResponse(MentorSessionCreate):
    id: uuid.UUID
    status: SessionStatus = SessionStatus.SCHEDULED
    mentor_feedback: Optional[str] = None
    student_feedback: Optional[str] = None
    student_rating: Optional[int] = None  # 1-5
    created_at: datetime

    class Config:
        from_attributes = True
