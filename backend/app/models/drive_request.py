"""Recruiter-proposed campus drive approval models."""

from datetime import date
from enum import Enum
from typing import List, Literal, Optional
import uuid

from pydantic import BaseModel, Field, model_validator


class DriveRequestStatus(str, Enum):
    PENDING = "pending"
    CHANGES_REQUESTED = "changes_requested"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class DriveRequestEligibility(BaseModel):
    min_cgpa: Optional[float] = Field(default=None, ge=0, le=10)
    max_backlogs: Optional[int] = Field(default=0, ge=0)
    eligible_branches: List[str] = Field(default_factory=list)
    graduation_year: Optional[int] = Field(default=None, ge=2000, le=2100)
    other_criteria: Optional[str] = None


class DriveRequestCreate(BaseModel):
    university_id: uuid.UUID
    title: str = Field(min_length=3, max_length=200)
    role: str = Field(min_length=2, max_length=150)
    description: Optional[str] = None
    eligibility: DriveRequestEligibility = Field(default_factory=DriveRequestEligibility)
    drive_date: Optional[date] = None
    registration_deadline: Optional[date] = None
    package_lpa: Optional[float] = Field(default=None, ge=0)
    location: Optional[str] = None

    @model_validator(mode="after")
    def deadline_precedes_drive(self):
        if (
            self.drive_date
            and self.registration_deadline
            and self.registration_deadline > self.drive_date
        ):
            raise ValueError("Registration deadline must be on or before the drive date")
        return self


class DriveRequestResubmit(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=200)
    role: Optional[str] = Field(default=None, min_length=2, max_length=150)
    description: Optional[str] = None
    eligibility: Optional[DriveRequestEligibility] = None
    drive_date: Optional[date] = None
    registration_deadline: Optional[date] = None
    package_lpa: Optional[float] = Field(default=None, ge=0)
    location: Optional[str] = None

    @model_validator(mode="after")
    def deadline_precedes_drive(self):
        if (
            self.drive_date
            and self.registration_deadline
            and self.registration_deadline > self.drive_date
        ):
            raise ValueError("Registration deadline must be on or before the drive date")
        return self


class DriveRequestReview(BaseModel):
    action: Literal["approve", "reject", "request_changes"]
    notes: Optional[str] = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def notes_required_for_non_approval(self):
        if self.action in {"reject", "request_changes"} and not (self.notes or "").strip():
            raise ValueError("Review notes are required when rejecting or requesting changes")
        return self
