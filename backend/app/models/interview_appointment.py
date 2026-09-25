"""Recruiter-led interview appointment inputs (not AI mock interviews)."""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional
import uuid
from urllib.parse import urlparse

from pydantic import BaseModel, Field, field_validator, model_validator


class ApplicationKind(str, Enum):
    JOB = "job"
    DRIVE = "drive"


class MeetingMode(str, Enum):
    ONLINE = "online"
    IN_PERSON = "in_person"


class AppointmentStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class AppointmentCreate(BaseModel):
    application_kind: ApplicationKind
    application_id: uuid.UUID
    starts_at: datetime
    duration_minutes: int = Field(default=45, ge=15, le=180)
    round_name: str = Field(default="Recruiter interview", min_length=2, max_length=100)
    meeting_mode: MeetingMode = MeetingMode.ONLINE
    meeting_url: Optional[str] = Field(default=None, max_length=2048)
    location: Optional[str] = Field(default=None, max_length=250)
    notes: Optional[str] = Field(default=None, max_length=2000)

    @field_validator("starts_at")
    @classmethod
    def require_future_aware_datetime(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Interview time must include a timezone")
        if value <= datetime.now(timezone.utc):
            raise ValueError("Interview time must be in the future")
        return value

    @model_validator(mode="after")
    def require_venue(self):
        if self.meeting_mode == MeetingMode.ONLINE:
            parsed = urlparse(self.meeting_url or "")
            if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
                raise ValueError("An online interview needs a valid HTTPS meeting link")
        elif not self.location or not self.location.strip():
            raise ValueError("An in-person interview needs a location")
        return self


class AppointmentUpdate(BaseModel):
    starts_at: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(default=None, ge=15, le=180)
    round_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    meeting_mode: Optional[MeetingMode] = None
    meeting_url: Optional[str] = Field(default=None, max_length=2048)
    location: Optional[str] = Field(default=None, max_length=250)
    notes: Optional[str] = Field(default=None, max_length=2000)
    status: Optional[AppointmentStatus] = None

    @field_validator("starts_at")
    @classmethod
    def require_aware_datetime(cls, value: Optional[datetime]) -> Optional[datetime]:
        if value is not None and (value.tzinfo is None or value.utcoffset() is None):
            raise ValueError("Interview time must include a timezone")
        return value
