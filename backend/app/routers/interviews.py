"""
AI Mock Interview router
Endpoints: start session, submit answer (get next Q + feedback), complete session
"""

from fastapi import APIRouter, HTTPException, Depends, status
from app.models.interview import (
    InterviewCreate, InterviewAnswer, InterviewResponse, InterviewFeedback
)
from app.middleware.auth import require_student
from app.database import get_supabase
from app.services.gemini_service import (
    generate_interview_questions, evaluate_interview_answer, generate_interview_summary
)
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_student_profile(supabase, user_id):
    profile = supabase.table("student_profiles").select("*") \
        .eq("user_id", str(user_id)).limit(1).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Complete your profile first")
    return profile.data[0]


def _get_owned_interview(supabase, interview_id, user_id):
    profile = _get_student_profile(supabase, user_id)
    interview = supabase.table("interviews").select("*") \
        .eq("id", str(interview_id)) \
        .eq("student_id", profile["id"]) \
        .limit(1).execute()
    if not interview.data:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return interview.data[0]


@router.post("/start", response_model=InterviewResponse, status_code=201)
async def start_interview(data: InterviewCreate, current_user=Depends(require_student)):
    """
    Start an AI mock interview session.
    Gemini generates contextual questions based on job/role and student profile.
    """
    supabase = get_supabase()
    try:
        profile = _get_student_profile(supabase, current_user.id)

        # Get job context if provided
        job_context = None
        valid_job_id = None
        if data.job_id:
            job_res = supabase.table("jobs").select("*").eq("id", str(data.job_id)).limit(1).execute()
            if job_res.data and len(job_res.data) > 0:
                job_context = job_res.data[0]
                valid_job_id = str(data.job_id)
            else:
                drive_res = supabase.table("placement_drives").select("*").eq("id", str(data.job_id)).limit(1).execute()
                if drive_res.data and len(drive_res.data) > 0:
                    d = drive_res.data[0]
                    eligibility = d.get("eligibility") or d.get("eligibility_criteria") or {}
                    skills = eligibility.get("required_skills") or eligibility.get("eligible_branches") or []
                    job_context = {
                        "id": d.get("id"),
                        "title": d.get("role") or d.get("title") or "Software Engineer",
                        "company": d.get("company_name") or "Tech Company",
                        "skills_required": skills if isinstance(skills, list) else [str(skills)],
                        "description": d.get("description", ""),
                    }
                    # Note: placement_drives.id is not a foreign key in jobs table, so valid_job_id stays None for DB integrity

        # Map interview type to allowed DB check constraint ('technical', 'behavioral', 'mixed')
        db_type = "technical"
        if data.interview_type in ["behavioral", "hr"]:
            db_type = "behavioral"
        elif data.interview_type in ["technical", "system_design"]:
            db_type = "technical"
        else:
            db_type = "mixed"

        # Generate first question with Gemini
        questions = await generate_interview_questions(
            profile=profile,
            job=job_context,
            interview_type=data.interview_type,
            difficulty=data.difficulty,
            target_role=data.target_role,
            num_questions=data.num_questions,
        )

        first_question = questions[0] if questions else "Tell me about yourself."

        # DB table 'interviews' columns: id, student_id, job_id, interview_type, difficulty, status, questions_asked, responses, feedback
        # Note: current_question does not exist as a column in DB table
        payload = {
            "student_id": profile["id"],
            "job_id": valid_job_id,
            "interview_type": db_type,
            "difficulty": data.difficulty,
            "status": "active",
            "questions_asked": questions,
            "responses": [],
        }

        result = supabase.table("interviews").insert(payload).execute()
        created = result.data[0]
        # Attach current_question for response model
        created["current_question"] = first_question
        created["interview_type"] = data.interview_type
        return created

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Interview start error: {e}")
        raise HTTPException(status_code=500, detail="Failed to start interview")


@router.post("/answer")
async def submit_answer(data: InterviewAnswer, current_user=Depends(require_student)):
    """
    Submit an answer and get AI evaluation + next question.
    Returns: score, feedback, next question (or completion signal)
    """
    supabase = get_supabase()
    try:
        interview = _get_owned_interview(supabase, data.interview_id, current_user.id)
        if interview["status"] != "active":
            raise HTTPException(status_code=400, detail="Interview session is not active")

        # Evaluate answer with Gemini
        evaluation = await evaluate_interview_answer(
            question=data.question,
            answer=data.answer,
            interview_type=interview["interview_type"],
        )

        # Update responses
        responses = interview.get("responses") or []
        responses.append({
            "question": data.question,
            "answer": data.answer,
            "question_index": data.question_index,
            "evaluation": evaluation,
        })

        questions_asked = interview.get("questions_asked") or []
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
async def complete_interview(interview_id: uuid.UUID, current_user=Depends(require_student)):
    """Generate comprehensive interview feedback report"""
    supabase = get_supabase()
    try:
        interview = _get_owned_interview(supabase, interview_id, current_user.id)
        feedback = await generate_interview_summary(interview)

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
async def list_interviews(current_user=Depends(require_student)):
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
        items = result.data or []
        for item in items:
            q_asked = item.get("questions_asked") or []
            resps = item.get("responses") or []
            idx = len(resps)
            item["current_question"] = q_asked[idx] if idx < len(q_asked) else None
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch interviews")
