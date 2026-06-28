"""Application Pydantic models"""

from pydantic import BaseModel
from typing import Optional
from enum import Enum
from datetime import date, datetime
import uuid


class ApplicationStatus(str, Enum):
    SUBMITTED = "submitted"
    REVIEWED = "reviewed"
    SHORTLISTED = "shortlisted"
    INTERVIEWED = "interviewed"
    OFFERED = "offered"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class ApplicationCreate(BaseModel):
    job_id: uuid.UUID
    cover_letter: Optional[str] = None


class ApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    next_step: Optional[str] = None
    next_step_date: Optional[date] = None
    recruiter_notes: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    job_id: uuid.UUID
    cover_letter: Optional[str] = None
    status: ApplicationStatus = ApplicationStatus.SUBMITTED
    next_step: Optional[str] = None
    next_step_date: Optional[date] = None
    applied_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
