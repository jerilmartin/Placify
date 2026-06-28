"""Pydantic models for all platform entities"""

from .user import (
    UserRole, UserBase, UserCreate, UserLogin, UserResponse,
    TokenResponse, RefreshTokenRequest,
)
from .student import (
    StudentProfileBase, StudentProfileCreate, StudentProfileUpdate, StudentProfileResponse,
    Project, WorkExperience,
)
from .job import (
    JobType, JobStatus, ExperienceLevel,
    JobBase, JobCreate, JobUpdate, JobResponse,
    JobMatchResponse,
)
from .application import (
    ApplicationStatus,
    ApplicationCreate, ApplicationUpdate, ApplicationResponse,
)
from .interview import (
    InterviewType, InterviewDifficulty, InterviewStatus,
    InterviewCreate, InterviewResponse, InterviewAnswer,
    InterviewFeedback,
)
from .recruiter import (
    RecruiterProfileBase, RecruiterProfileCreate, RecruiterProfileResponse,
)
from .university import (
    UniversityProfileBase, UniversityProfileCreate, UniversityProfileResponse,
    PlacementDriveCreate, PlacementDriveResponse,
)
from .mentor import (
    MentorProfileBase, MentorProfileCreate, MentorProfileResponse,
    MentorSessionCreate, MentorSessionResponse,
)

__all__ = [
    # User/Auth
    "UserRole", "UserBase", "UserCreate", "UserLogin", "UserResponse",
    "TokenResponse", "RefreshTokenRequest",
    # Student
    "StudentProfileBase", "StudentProfileCreate", "StudentProfileUpdate",
    "StudentProfileResponse", "Project", "WorkExperience",
    # Job
    "JobType", "JobStatus", "ExperienceLevel",
    "JobBase", "JobCreate", "JobUpdate", "JobResponse", "JobMatchResponse",
    # Application
    "ApplicationStatus", "ApplicationCreate", "ApplicationUpdate", "ApplicationResponse",
    # Interview
    "InterviewType", "InterviewDifficulty", "InterviewStatus",
    "InterviewCreate", "InterviewResponse", "InterviewAnswer", "InterviewFeedback",
    # Recruiter
    "RecruiterProfileBase", "RecruiterProfileCreate", "RecruiterProfileResponse",
    # University
    "UniversityProfileBase", "UniversityProfileCreate", "UniversityProfileResponse",
    "PlacementDriveCreate", "PlacementDriveResponse",
    # Mentor
    "MentorProfileBase", "MentorProfileCreate", "MentorProfileResponse",
    "MentorSessionCreate", "MentorSessionResponse",
]
