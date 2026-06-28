"""Job Pydantic models"""

from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
from datetime import date, datetime
import uuid


class JobType(str, Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    INTERNSHIP = "internship"
    CONTRACT = "contract"


class JobStatus(str, Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    DRAFT = "draft"


class ExperienceLevel(str, Enum):
    ENTRY = "entry"
    MID = "mid"
    SENIOR = "senior"


class JobBase(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    skills_required: List[str] = []
    job_type: Optional[JobType] = JobType.FULL_TIME
    experience_level: Optional[ExperienceLevel] = ExperienceLevel.ENTRY
    salary_range: Optional[str] = None
    package_lpa: Optional[float] = None  # Package in LPA
    deadline: Optional[date] = None
    min_cgpa: Optional[float] = None
    eligible_branches: Optional[List[str]] = []
    no_of_openings: Optional[int] = None
    bond_details: Optional[str] = None


class JobCreate(JobBase):
    recruiter_id: Optional[uuid.UUID] = None
    university_id: Optional[uuid.UUID] = None  # For campus-specific drives
    placement_drive_id: Optional[uuid.UUID] = None


class JobUpdate(JobBase):
    status: Optional[JobStatus] = None


class JobResponse(JobBase):
    id: uuid.UUID
    status: JobStatus = JobStatus.ACTIVE
    recruiter_id: Optional[uuid.UUID] = None
    university_id: Optional[uuid.UUID] = None
    placement_drive_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JobMatchResponse(BaseModel):
    id: uuid.UUID
    job: JobResponse
    match_score: int  # 0-100
    match_reason: Optional[str] = None
    skill_matches: List[str] = []
    missing_skills: List[str] = []
    recommendation: Optional[str] = None
    viewed: bool = False
    created_at: datetime

    class Config:
        from_attributes = True
