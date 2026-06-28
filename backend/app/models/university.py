"""University Pydantic models"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from enum import Enum
from datetime import date, datetime
import uuid


class DriveStatus(str, Enum):
    UPCOMING = "upcoming"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class UniversityProfileBase(BaseModel):
    name: str
    location: Optional[str] = None
    website: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    placement_officer_name: Optional[str] = None
    accreditation: Optional[str] = None
    established_year: Optional[int] = None


class UniversityProfileCreate(UniversityProfileBase):
    user_id: uuid.UUID


class UniversityProfileUpdate(UniversityProfileBase):
    pass


class UniversityProfileResponse(UniversityProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    verified: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EligibilityCriteria(BaseModel):
    min_cgpa: Optional[float] = None
    eligible_branches: Optional[List[str]] = []
    max_backlogs: int = 0
    graduation_year: Optional[int] = None
    other_criteria: Optional[str] = None


class PlacementDriveCreate(BaseModel):
    title: str
    company_name: str
    university_id: uuid.UUID
    description: Optional[str] = None
    eligibility: EligibilityCriteria = EligibilityCriteria()
    drive_date: Optional[date] = None
    registration_deadline: Optional[date] = None
    package_lpa: Optional[float] = None
    role: Optional[str] = None
    location: Optional[str] = None


class PlacementDriveResponse(PlacementDriveCreate):
    id: uuid.UUID
    status: DriveStatus = DriveStatus.UPCOMING
    total_registered: int = 0
    total_selected: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
