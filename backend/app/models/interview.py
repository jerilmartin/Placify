"""Interview Pydantic models"""

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime
import uuid


class InterviewType(str, Enum):
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
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
    target_role: Optional[str] = None  # For generic practice
    num_questions: int = 5


class InterviewAnswer(BaseModel):
    interview_id: uuid.UUID
    question: str
    answer: str
    question_index: int


class QuestionFeedback(BaseModel):
    question: str
    answer: str
    score: int  # 0-10
    feedback: str
    ideal_answer_hints: List[str] = []


class InterviewFeedback(BaseModel):
    overall_score: int  # 0-100
    confidence_score: int
    communication_score: int
    technical_accuracy_score: int
    strengths: List[str] = []
    improvements: List[str] = []
    question_feedbacks: List[QuestionFeedback] = []
    overall_recommendation: str


class InterviewResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    job_id: Optional[uuid.UUID] = None
    interview_type: InterviewType
    difficulty: InterviewDifficulty
    status: InterviewStatus
    current_question: Optional[str] = None
    questions_asked: List[str] = []
    responses: Optional[List[Dict[str, Any]]] = []
    feedback: Optional[InterviewFeedback] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
