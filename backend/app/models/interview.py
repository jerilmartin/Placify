"""Interview Pydantic models"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime
import uuid


class InterviewType(str, Enum):
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    SYSTEM_DESIGN = "system_design"
    MIXED = "mixed"
    HR = "hr"


class InterviewDifficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class InterviewStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class InterviewCreate(BaseModel):
    job_id: Optional[uuid.UUID] = None
    interview_type: InterviewType = InterviewType.MIXED
    difficulty: InterviewDifficulty = InterviewDifficulty.MEDIUM
    target_role: Optional[str] = Field(default=None, max_length=120)  # For generic practice
    num_questions: int = Field(default=5, ge=3, le=10)


class InterviewAnswer(BaseModel):
    interview_id: uuid.UUID
    question: str
    answer: str = Field(min_length=10, max_length=10000)
    question_index: int = Field(ge=0)


class QuestionFeedback(BaseModel):
    question: str
    answer: str
    score: int  # 0-100
    feedback: str
    ideal_answer_hints: List[str] = []


class InterviewFeedback(BaseModel):
    overall_score: int = 0  # 0-100
    confidence_score: int = 0
    communication_score: int = 0
    technical_accuracy_score: int = 0
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    question_feedbacks: List[QuestionFeedback] = Field(default_factory=list)
    overall_recommendation: str = "Review your answers and continue practicing."


class InterviewResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    job_id: Optional[uuid.UUID] = None
    interview_type: InterviewType
    difficulty: InterviewDifficulty
    status: InterviewStatus
    current_question: Optional[str] = None
    questions_asked: List[str] = Field(default_factory=list)
    responses: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    feedback: Optional[InterviewFeedback] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
