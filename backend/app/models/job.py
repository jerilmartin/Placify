"""Job Pydantic models"""

from pydantic import BaseModel, Field
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
    skills_required: List[str] = Field(default_factory=list)
    job_type: Optional[JobType] = JobType.FULL_TIME
    experience_level: Optional[ExperienceLevel] = ExperienceLevel.ENTRY
    salary_range: Optional[str] = None
    package_lpa: Optional[float] = Field(default=None, ge=0)  # Package in LPA
    deadline: Optional[date] = None
    min_cgpa: Optional[float] = Field(default=None, ge=0, le=10)
    eligible_branches: Optional[List[str]] = Field(default_factory=list)
    no_of_openings: Optional[int] = Field(default=None, ge=1)
    bond_details: Optional[str] = None


class JobCreate(JobBase):
    recruiter_id: Optional[uuid.UUID] = None
    university_id: Optional[uuid.UUID] = None  # For campus-specific drives
    placement_drive_id: Optional[uuid.UUID] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    skills_required: Optional[List[str]] = None
    job_type: Optional[JobType] = None
    experience_level: Optional[ExperienceLevel] = None
    salary_range: Optional[str] = None
    package_lpa: Optional[float] = Field(default=None, ge=0)
    deadline: Optional[date] = None
    min_cgpa: Optional[float] = Field(default=None, ge=0, le=10)
    eligible_branches: Optional[List[str]] = None
    no_of_openings: Optional[int] = Field(default=None, ge=1)
    bond_details: Optional[str] = None
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
