"""Student profile Pydantic models"""

from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
import uuid


class Project(BaseModel):
    name: str
    description: str
    tech_stack: List[str] = []
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    duration: Optional[str] = None


class WorkExperience(BaseModel):
    company: str
    role: str
    duration: str
    description: str
    skills_used: List[str] = []


class StudentProfileBase(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    university: Optional[str] = None
    course: Optional[str] = None
    graduation_year: Optional[int] = Field(default=None, ge=2000, le=2035)
    cgpa: Optional[float] = Field(default=None, ge=0.0, le=10.0)
    active_backlogs: Optional[int] = Field(default=0, ge=0)
    skills: Optional[List[str]] = []
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    projects: Optional[List[Project]] = []
    work_experience: Optional[List[WorkExperience]] = []
    achievements: Optional[str] = None


class StudentProfileCreate(StudentProfileBase):
    user_id: uuid.UUID
    student_id: Optional[str] = None
    email: str


class StudentProfileUpdate(StudentProfileBase):
    pass


class StudentProfileResponse(StudentProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    student_id: Optional[str] = None
    email: Optional[str] = None
    profile_completion: int = 0
    placement_probability: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
