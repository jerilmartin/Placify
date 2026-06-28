"""
Gemini AI Service
Handles all interactions with Google Gemini 2.5 Pro/Flash
"""

import google.generativeai as genai
from app.config import settings
import logging
import json
from typing import Optional

logger = logging.getLogger(__name__)

# Initialize Gemini
_gemini_configured = False


def _get_model(use_flash: bool = False):
    """Get configured Gemini model"""
    global _gemini_configured
    if not _gemini_configured:
        if not settings.gemini_api_key:
            logger.warning("GEMINI_API_KEY not set. AI features will return stubs.")
            return None
        genai.configure(api_key=settings.gemini_api_key)
        _gemini_configured = True

    model_name = settings.gemini_model_flash if use_flash else settings.gemini_model_pro
    return genai.GenerativeModel(model_name)


def _stub_response(feature: str, data: dict = None) -> dict:
    """Return stub response when Gemini is not configured"""
    logger.info(f"Gemini stub response for: {feature}")
    stubs = {
        "extract_resume_data": {
            "name": "Sample Student",
            "email": "",
            "phone": "",
            "skills": ["Python", "JavaScript", "SQL"],
            "education": [{"degree": "B.Tech CSE", "institution": "Sample University", "year": 2025}],
            "experience": [],
            "projects": [],
        },
        "improve_resume": {
            "ats_score": 65,
            "overall_grade": "C+",
            "issues": ["Add quantified achievements", "Include industry keywords", "Improve project descriptions"],
            "keyword_suggestions": ["Docker", "AWS", "REST API", "Agile"],
            "section_scores": {"summary": 60, "experience": 50, "skills": 70, "education": 80},
        },
        "generate_cover_letter": "Dear Hiring Manager,\n\nI am excited to apply for this position...\n\n[AI Gemini cover letter will appear here when API key is configured]\n\nBest regards,\nYour Name",
        "interview_questions": [
            "Tell me about yourself.",
            "What are your key technical skills?",
            "Describe a challenging project you worked on.",
            "How do you handle tight deadlines?",
            "Where do you see yourself in 5 years?",
        ],
        "evaluate_answer": {
            "score": 7,
            "feedback": "Good answer. Consider adding more specific examples.",
            "strengths": ["Clear communication", "Relevant experience mentioned"],
            "improvements": ["Add metrics/numbers", "Be more concise"],
        },
        "career_guidance": "Based on your profile, I recommend focusing on cloud computing skills (AWS/GCP) and system design to boost your placement probability. Consider building 2-3 impactful projects.\n\n[Full AI guidance available with Gemini API key]",
        "resume_vs_job": {
            "match_percentage": 72,
            "matching_skills": ["Python", "SQL"],
            "missing_skills": ["Docker", "Kubernetes", "AWS"],
            "recommendations": ["Add a cloud project to your portfolio", "Get AWS Cloud Practitioner certification"],
            "cover_letter_tips": ["Emphasize Python experience", "Mention your team collaboration skills"],
        },
        "placement_risk": {
            "risk_level": "Medium",
            "probability": 74,
            "factors": {"skills": 70, "cgpa": 80, "projects": 60, "activity": 65},
            "top_improvements": ["Complete 2 more projects", "Get SQL certification", "Attend mock interviews"],
        },
    }
    return stubs.get(feature, {"message": "AI feature not available - configure GEMINI_API_KEY"})


# ── Resume Features ──────────────────────────────────────────────────────────

async def extract_resume_data(resume_text: str) -> dict:
    """Extract structured data from resume text using Gemini"""
    model = _get_model(use_flash=True)
    if not model:
        return _stub_response("extract_resume_data")

    try:
        prompt = f"""
        Extract structured information from this resume text and return as JSON:
        
        Resume:
        {resume_text[:3000]}
        
        Return JSON with these fields:
        {{
            "name": "",
            "email": "",
            "phone": "",
            "location": "",
            "skills": [],
            "education": [{{"degree": "", "institution": "", "year": null, "cgpa": null}}],
            "experience": [{{"company": "", "role": "", "duration": "", "description": ""}}],
            "projects": [{{"name": "", "description": "", "tech_stack": []}}],
            "achievements": [],
            "linkedin": "",
            "github": ""
        }}
        
        Return ONLY valid JSON, no markdown.
        """

        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)
    except Exception as e:
        logger.error(f"Gemini extract_resume_data error: {e}")
        return _stub_response("extract_resume_data")


async def improve_resume(resume_text: str) -> dict:
    """Generate AI resume improvement suggestions"""
    model = _get_model(use_flash=True)
    if not model:
        return _stub_response("improve_resume")

    try:
        prompt = f"""
        Analyze this resume and provide improvement suggestions. Return as JSON:
        
        Resume:
        {resume_text[:3000]}
        
        Return JSON:
        {{
            "ats_score": <0-100>,
            "overall_grade": "<A/B/C/D>",
            "issues": ["<issue1>", "<issue2>"],
            "keyword_suggestions": ["<keyword1>"],
            "section_scores": {{"summary": <0-100>, "experience": <0-100>, "skills": <0-100>, "education": <0-100>}},
            "specific_improvements": [{{"section": "", "current": "", "suggestion": ""}}]
        }}
        
        Return ONLY valid JSON.
        """
        response = model.generate_content(prompt)
        text = response.text.strip().strip("```json").strip("```")
        return json.loads(text)
    except Exception as e:
        logger.error(f"Gemini improve_resume error: {e}")
        return _stub_response("improve_resume")


async def generate_cover_letter(resume_text: str, job: dict) -> str:
    """Generate tailored cover letter"""
    model = _get_model(use_flash=True)
    if not model:
        return _stub_response("generate_cover_letter")

    try:
        prompt = f"""
        Write a professional, tailored cover letter for this job application.
        
        Resume Summary:
        {resume_text[:1500]}
        
        Job Details:
        Title: {job.get('title')}
        Company: {job.get('company')}
        Description: {job.get('description', '')[:500]}
        Required Skills: {', '.join(job.get('skills_required', []))}
        
        Write a compelling 3-paragraph cover letter. Be specific and professional.
        """
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Gemini cover letter error: {e}")
        return _stub_response("generate_cover_letter")


# ── Interview Features ───────────────────────────────────────────────────────

async def generate_interview_questions(
    profile: dict, job: Optional[dict], interview_type: str,
    difficulty: str, target_role: Optional[str], num_questions: int
) -> list:
    """Generate contextual interview questions"""
    model = _get_model(use_flash=True)
    if not model:
        return _stub_response("interview_questions")

    try:
        job_title = job.get("title") if job else target_role or "Software Developer"
        company = job.get("company") if job else "a tech company"
        skills = ', '.join(profile.get("skills", [])[:10])
        job_skills = ', '.join(job.get("skills_required", [])[:10]) if job else ""

        prompt = f"""
        Generate exactly {num_questions} interview questions for a {difficulty} difficulty {interview_type} interview.
        
        Candidate: {profile.get('full_name', 'Candidate')}
        Skills: {skills}
        Role: {job_title} at {company}
        Required Skills: {job_skills}
        
        Return ONLY a JSON array of question strings. No numbering, no extra text.
        Example: ["Question 1?", "Question 2?"]
        """
        response = model.generate_content(prompt)
        text = response.text.strip().strip("```json").strip("```").strip()
        questions = json.loads(text)
        return questions[:num_questions]
    except Exception as e:
        logger.error(f"Gemini question generation error: {e}")
        return _stub_response("interview_questions")


async def evaluate_interview_answer(question: str, answer: str, interview_type: str) -> dict:
    """Evaluate an interview answer and provide feedback"""
    model = _get_model(use_flash=True)
    if not model:
        return _stub_response("evaluate_answer")

    try:
        prompt = f"""
        Evaluate this interview answer for a {interview_type} interview. Return as JSON:
        
        Question: {question}
        Answer: {answer}
        
        Return JSON:
        {{
            "score": <1-10>,
            "feedback": "<brief feedback>",
            "strengths": ["<strength1>"],
            "improvements": ["<improvement1>"],
            "ideal_answer_hints": ["<hint1>"]
        }}
        
        Return ONLY valid JSON.
        """
        response = model.generate_content(prompt)
        text = response.text.strip().strip("```json").strip("```")
        return json.loads(text)
    except Exception as e:
        logger.error(f"Gemini answer evaluation error: {e}")
        return _stub_response("evaluate_answer")


async def generate_interview_summary(interview_data: dict) -> dict:
    """Generate comprehensive interview feedback report"""
    model = _get_model()
    if not model:
        return {
            "overall_score": 70,
            "confidence_score": 65,
            "communication_score": 75,
            "technical_accuracy_score": 60,
            "strengths": ["Good communication", "Relevant experience"],
            "improvements": ["Be more specific", "Add technical depth"],
            "overall_recommendation": "Keep practicing! Focus on technical concepts.",
        }
    try:
        responses = interview_data.get("responses", [])
        qa_summary = "\n".join([
            f"Q: {r['question']}\nA: {r['answer']}\nScore: {r.get('evaluation', {}).get('score', 'N/A')}/10"
            for r in responses
        ])

        prompt = f"""
        Generate a comprehensive interview performance report. Return as JSON:
        
        Interview Type: {interview_data.get('interview_type')}
        Responses:
        {qa_summary[:3000]}
        
        Return JSON:
        {{
            "overall_score": <0-100>,
            "confidence_score": <0-100>,
            "communication_score": <0-100>,
            "technical_accuracy_score": <0-100>,
            "strengths": ["<strength>"],
            "improvements": ["<improvement>"],
            "overall_recommendation": "<detailed recommendation>"
        }}
        """
        response = model.generate_content(prompt)
        text = response.text.strip().strip("```json").strip("```")
        return json.loads(text)
    except Exception as e:
        logger.error(f"Interview summary error: {e}")
        return {"overall_score": 70, "overall_recommendation": "Summary generation failed. Please retry."}


# ── Career & Recruiter Features ───────────────────────────────────────────────

async def career_guidance_chat(message: str, history: list, student_context: dict) -> str:
    """AI career guidance chatbot"""
    model = _get_model(use_flash=True)
    if not model:
        return _stub_response("career_guidance")

    try:
        skills = ', '.join(student_context.get("skills", [])[:10]) if student_context else "not provided"
        cgpa = student_context.get("cgpa", "N/A")
        course = student_context.get("course", "N/A")

        system_context = f"""You are an expert career mentor for engineering students.
        Student context: Course: {course}, CGPA: {cgpa}, Skills: {skills}
        Provide practical, actionable career advice. Be encouraging but realistic."""

        full_prompt = f"{system_context}\n\nStudent: {message}"
        response = model.generate_content(full_prompt)
        return response.text
    except Exception as e:
        logger.error(f"Career guidance error: {e}")
        return "I'm unable to provide guidance at the moment. Please try again later."


async def analyze_resume_vs_job(resume_text: str, resume_data: dict, job: dict) -> dict:
    """Deep resume vs job analysis"""
    model = _get_model(use_flash=True)
    if not model:
        return _stub_response("resume_vs_job")

    try:
        prompt = f"""
        Analyze how well this resume matches the job. Return JSON:
        
        Resume Skills: {', '.join(resume_data.get('skills', []) if resume_data else [])}
        Resume Text (first 1000 chars): {resume_text[:1000]}
        
        Job: {job.get('title')} at {job.get('company')}
        Required Skills: {', '.join(job.get('skills_required', []))}
        Description: {job.get('description', '')[:500]}
        
        Return JSON:
        {{
            "match_percentage": <0-100>,
            "matching_skills": [],
            "missing_skills": [],
            "recommendations": ["<action1>"],
            "cover_letter_tips": ["<tip1>"],
            "overall_assessment": "<brief assessment>"
        }}
        """
        response = model.generate_content(prompt)
        text = response.text.strip().strip("```json").strip("```")
        return json.loads(text)
    except Exception as e:
        logger.error(f"Resume vs job analysis error: {e}")
        return _stub_response("resume_vs_job")


async def recruiter_ai_search(query: str, supabase) -> dict:
    """Convert natural language query to structured DB search"""
    model = _get_model(use_flash=True)
    if not model:
        return {"students": [], "message": "AI search not available - configure GEMINI_API_KEY"}

    try:
        prompt = f"""
        Convert this recruiter search query into structured filters for a student database.
        Query: "{query}"
        
        Return JSON:
        {{
            "skills": ["skill1", "skill2"],
            "min_cgpa": null,
            "course": null,
            "graduation_year": null
        }}
        Return ONLY valid JSON.
        """
        response = model.generate_content(prompt)
        text = response.text.strip().strip("```json").strip("```")
        filters = json.loads(text)

        # Execute search
        db_query = supabase.table("student_profiles").select("*")
        if filters.get("skills"):
            for skill in filters["skills"]:
                db_query = db_query.contains("skills", [skill])
        if filters.get("min_cgpa"):
            db_query = db_query.gte("cgpa", filters["min_cgpa"])

        result = db_query.limit(50).execute()
        return {
            "query": query,
            "filters_applied": filters,
            "students": result.data or [],
            "count": len(result.data or []),
        }
    except Exception as e:
        logger.error(f"AI search error: {e}")
        return {"students": [], "error": str(e)}


async def predict_placement_risk(profile: dict) -> dict:
    """Predict placement risk using rule-based + ML scoring"""
    # This is the rule-based version; ML model overrides this when available
    skills_count = len(profile.get("skills") or [])
    cgpa = profile.get("cgpa") or 0
    projects = len(profile.get("projects") or [])
    work_exp = len(profile.get("work_experience") or [])
    profile_completion = profile.get("profile_completion", 0)

    # Weighted scoring
    score = (
        min(skills_count * 5, 30) +   # Up to 30 pts for skills
        (cgpa / 10 * 25) +             # Up to 25 pts for CGPA
        min(projects * 8, 25) +        # Up to 25 pts for projects
        min(work_exp * 5, 10) +        # Up to 10 pts for work exp
        (profile_completion * 0.1)     # Up to 10 pts for completion
    )

    probability = min(round(score), 100)
    risk_level = "High" if probability < 50 else "Medium" if probability < 75 else "Low"

    improvements = []
    if skills_count < 5:
        improvements.append("Add more technical skills (target: 8+)")
    if cgpa < 7.0:
        improvements.append("Maintain CGPA above 7.0")
    if projects < 3:
        improvements.append("Build 2-3 more portfolio projects")
    if not work_exp:
        improvements.append("Get an internship or relevant experience")
    if profile_completion < 80:
        improvements.append("Complete your profile (currently {profile_completion}%)")

    return {
        "risk_level": risk_level,
        "probability": probability,
        "factors": {
            "skills": min(skills_count * 5, 30),
            "cgpa": round(cgpa / 10 * 25),
            "projects": min(projects * 8, 25),
            "experience": min(work_exp * 5, 10),
            "profile_completion": round(profile_completion * 0.1),
        },
        "top_improvements": improvements[:3],
        "message": f"Your placement probability is {probability}%. Risk level: {risk_level}."
    }
