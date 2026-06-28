"""Analytics router — platform-wide insights"""

from fastapi import APIRouter, HTTPException, Depends
from app.middleware.auth import get_current_user
from app.database import get_supabase
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/student/overview")
async def student_dashboard_stats(current_user=Depends(get_current_user)):
    """Get student dashboard stats: applications, matches, interview score, profile strength"""
    supabase = get_supabase()
    try:
        profile = supabase.table("student_profiles").select("*").eq("user_id", str(current_user.id)).single().execute()
        if not profile.data:
            return {"error": "Profile not found"}

        student_id = profile.data["id"]

        apps = supabase.table("applications").select("status").eq("student_id", student_id).execute()
        matches = supabase.table("job_matches").select("match_score").eq("student_id", student_id).execute()
        interviews = supabase.table("interviews").select("feedback,status").eq("student_id", student_id).execute()

        app_statuses = {}
        for app in (apps.data or []):
            s = app["status"]
            app_statuses[s] = app_statuses.get(s, 0) + 1

        avg_match = 0
        if matches.data:
            scores = [m["match_score"] for m in matches.data if m.get("match_score")]
            avg_match = round(sum(scores) / len(scores)) if scores else 0

        completed_interviews = [i for i in (interviews.data or []) if i["status"] == "completed"]
        avg_interview_score = 0
        if completed_interviews:
            scores = []
            for i in completed_interviews:
                feedback = i.get("feedback") or {}
                if feedback.get("overall_score"):
                    scores.append(feedback["overall_score"])
            avg_interview_score = round(sum(scores) / len(scores)) if scores else 0

        return {
            "profile_completion": profile.data.get("profile_completion", 0),
            "placement_probability": profile.data.get("placement_probability"),
            "applications": {
                "total": len(apps.data or []),
                "by_status": app_statuses,
            },
            "job_matches": {
                "total": len(matches.data or []),
                "avg_score": avg_match,
            },
            "interviews": {
                "total": len(interviews.data or []),
                "completed": len(completed_interviews),
                "avg_score": avg_interview_score,
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch analytics")


@router.get("/platform/overview")
async def platform_overview(current_user=Depends(get_current_user)):
    """Platform-wide stats (admin/university view)"""
    supabase = get_supabase()
    try:
        students = supabase.table("student_profiles").select("id", count="exact").execute()
        jobs = supabase.table("jobs").select("id", count="exact").eq("status", "active").execute()
        applications = supabase.table("applications").select("id", count="exact").execute()
        offers = supabase.table("applications").select("id", count="exact").eq("status", "offered").execute()

        return {
            "total_students": students.count or 0,
            "active_jobs": jobs.count or 0,
            "total_applications": applications.count or 0,
            "total_offers": offers.count or 0,
            "placement_rate": round((offers.count / students.count * 100) if students.count else 0, 1),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch platform stats")
