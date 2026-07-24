"""Recruiter Pydantic models"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import uuid


class RecruiterProfileBase(BaseModel):
    company_name: str
    designation: Optional[str] = None
    company_website: Optional[str] = None
    company_description: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    headquarters: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None


class RecruiterProfileCreate(RecruiterProfileBase):
    user_id: Optional[uuid.UUID] = None


class RecruiterProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    designation: Optional[str] = None
    company_website: Optional[str] = None
    company_description: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    headquarters: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None


class RecruiterProfileResponse(RecruiterProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    verified: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
