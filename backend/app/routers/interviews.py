"""
AI Mock Interview router
Endpoints: start session, submit answer (get next Q + feedback), complete session
"""

from fastapi import APIRouter, HTTPException, Depends, status
from app.models.interview import (
    InterviewCreate, InterviewAnswer, InterviewResponse, InterviewFeedback
)
from app.middleware.auth import get_current_user
from app.database import get_supabase
from app.services.gemini_service import (
    generate_interview_questions, evaluate_interview_answer, generate_interview_summary
)
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/start", response_model=InterviewResponse, status_code=201)
async def start_interview(data: InterviewCreate, current_user=Depends(get_current_user)):
    """
    Start an AI mock interview session.
    Gemini generates contextual questions based on job/role and student profile.
    """
    supabase = get_supabase()
    try:
        profile = supabase.table("student_profiles") \
            .select("*").eq("user_id", str(current_user.id)).single().execute()
        if not profile.data:
            raise HTTPException(status_code=404, detail="Complete your profile first")

        # Get job context if provided
        job_context = None
        if data.job_id:
            job = supabase.table("jobs").select("*").eq("id", str(data.job_id)).single().execute()
            job_context = job.data

        # Generate first question with Gemini
        questions = await generate_interview_questions(
            profile=profile.data,
            job=job_context,
            interview_type=data.interview_type,
            difficulty=data.difficulty,
            target_role=data.target_role,
            num_questions=data.num_questions,
        )

        first_question = questions[0] if questions else "Tell me about yourself."

        payload = {
            "student_id": profile.data["id"],
            "job_id": str(data.job_id) if data.job_id else None,
            "interview_type": data.interview_type,
            "difficulty": data.difficulty,
            "status": "active",
            "current_question": first_question,
            "questions_asked": questions,
            "responses": [],
        }

        result = supabase.table("interviews").insert(payload).execute()
        return result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Interview start error: {e}")
        raise HTTPException(status_code=500, detail="Failed to start interview")


@router.post("/answer")
async def submit_answer(data: InterviewAnswer, current_user=Depends(get_current_user)):
    """
    Submit an answer and get AI evaluation + next question.
    Returns: score, feedback, next question (or completion signal)
    """
    supabase = get_supabase()
    try:
        interview = supabase.table("interviews") \
            .select("*").eq("id", str(data.interview_id)).single().execute()
        if not interview.data:
            raise HTTPException(status_code=404, detail="Interview session not found")
        if interview.data["status"] != "active":
            raise HTTPException(status_code=400, detail="Interview session is not active")

        # Evaluate answer with Gemini
        evaluation = await evaluate_interview_answer(
            question=data.question,
            answer=data.answer,
            interview_type=interview.data["interview_type"],
        )

        # Update responses
        responses = interview.data.get("responses") or []
        responses.append({
            "question": data.question,
            "answer": data.answer,
            "question_index": data.question_index,
            "evaluation": evaluation,
        })

        questions_asked = interview.data.get("questions_asked") or []
        next_question = None
        is_complete = data.question_index >= len(questions_asked) - 1

        if is_complete:
            supabase.table("interviews").update({
                "responses": responses,
                "status": "completed",
            }).eq("id", str(data.interview_id)).execute()
        else:
            next_question = questions_asked[data.question_index + 1]
            supabase.table("interviews").update({
                "responses": responses,
                "current_question": next_question,
            }).eq("id", str(data.interview_id)).execute()

        return {
            "evaluation": evaluation,
            "next_question": next_question,
            "is_complete": is_complete,
            "question_index": data.question_index + 1,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Answer submission error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process answer")


@router.post("/{interview_id}/complete", response_model=InterviewFeedback)
async def complete_interview(interview_id: uuid.UUID, current_user=Depends(get_current_user)):
    """Generate comprehensive interview feedback report"""
    supabase = get_supabase()
    try:
        interview = supabase.table("interviews") \
            .select("*").eq("id", str(interview_id)).single().execute()
        if not interview.data:
            raise HTTPException(status_code=404, detail="Interview not found")

        feedback = await generate_interview_summary(interview.data)

        supabase.table("interviews").update({
            "feedback": feedback,
            "status": "completed",
        }).eq("id", str(interview_id)).execute()

        return feedback

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate feedback")


@router.get("/", response_model=list[InterviewResponse])
async def list_interviews(current_user=Depends(get_current_user)):
    """List all interview sessions for current student"""
    supabase = get_supabase()
    try:
        profile = supabase.table("student_profiles") \
            .select("id").eq("user_id", str(current_user.id)).single().execute()
        if not profile.data:
            return []
        result = supabase.table("interviews") \
            .select("*") \
            .eq("student_id", profile.data["id"]) \
            .order("created_at", desc=True) \
            .execute()
        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch interviews")
