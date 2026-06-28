"""User and Authentication Pydantic models"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum
from datetime import datetime
import uuid


class UserRole(str, Enum):
    STUDENT = "student"
    RECRUITER = "recruiter"
    UNIVERSITY = "university"
    MENTOR = "mentor"
    ADMIN = "admin"
    PLACEMENT_OFFICER = "placement_officer"


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole


class UserCreate(UserBase):
    password: str
    university: Optional[str] = None
    student_id: Optional[str] = None
    course: Optional[str] = None
    graduation_year: Optional[int] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: uuid.UUID
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str
