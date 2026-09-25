"""
Gemini AI Service
Handles Google Gemini generation, quota failover, and honest unavailable states.
"""

import google.generativeai as genai
from app.config import settings
import asyncio
import logging
import json
import re
import time
from typing import Optional
from google.api_core.exceptions import ResourceExhausted

logger = logging.getLogger(__name__)


class AIServiceUnavailable(RuntimeError):
    """A required Gemini operation did not produce a usable result."""

    def __init__(self, message: str, status_code: int = 503):
        super().__init__(message)
        self.status_code = status_code


_rate_limited_until: dict[str, float] = {}


async def _generate_content(model, prompt: str):
    """Generate with a bounded request and an independent lower-cost quota fallback."""
    primary_name = model.model_name
    fallback_name = settings.gemini_model_fallback.strip()
    fallback = (
        genai.GenerativeModel(fallback_name)
        if fallback_name and not primary_name.endswith("/" + fallback_name)
        else None
    )
    def call(candidate):
        return candidate.generate_content(prompt, request_options={"timeout": 30})

    if fallback and _rate_limited_until.get(primary_name, 0) > time.monotonic():
        return await asyncio.to_thread(call, fallback)
    try:
        return await asyncio.to_thread(call, model)
    except ResourceExhausted:
        _rate_limited_until[primary_name] = time.monotonic() + 300
        if not fallback:
            raise
        logger.warning("Gemini model %s reached its quota; retrying with %s", primary_name, fallback_name)
        return await asyncio.to_thread(call, fallback)


def _safe_text(response) -> str:
    """Safely extract text from a Gemini response, handling blocked/empty outputs."""
    try:
        return response.text or ""
    except ValueError as e:
        # Gemini raises ValueError when finish_reason is not STOP (e.g. SAFETY, RECITATION)
        # or when the response parts are empty.
        logger.warning(f"Gemini response has no text content: {e}")
        return ""
    except Exception as e:
        logger.warning(f"Gemini response text extraction failed: {e}")
        return ""


# Initialize Gemini
_gemini_configured = False


def _get_model(use_flash: bool = False):
    """Get configured Gemini model"""
    global _gemini_configured
    if not _gemini_configured:
        if not settings.gemini_api_key:
            logger.warning("GEMINI_API_KEY not set. AI features are unavailable.")
            return None
        genai.configure(api_key=settings.gemini_api_key)
        _gemini_configured = True

    model_name = settings.gemini_model_flash if use_flash else settings.gemini_model_pro
    return genai.GenerativeModel(model_name)


# ── Resume Features ──────────────────────────────────────────────────────────

async def extract_resume_data(resume_text: str) -> dict:
    """Extract structured data from resume text using Gemini"""
    model = _get_model(use_flash=True)
    if not model:
        return {}

    try:
        prompt = f"""
You are a precise resume parser. Extract ALL structured information from the resume below and return ONLY valid JSON — no markdown, no extra text.

Resume Text:
{resume_text[:4000]}

Return this exact JSON schema (fill every field you can find, use null for missing numeric fields, empty string for missing text, empty array for missing lists):
{{
    "name": "<full name from resume header>",
    "email": "<email address>",
    "phone": "<phone number including country code if present>",
    "location": "<city, state or country if mentioned>",
    "bio": "<a 1-2 sentence professional summary if present, else empty string>",
    "skills": ["<skill1>", "<skill2>"],
    "education": [
        {{
            "degree": "<full degree name e.g. B.Tech Computer Science>",
            "institution": "<full university/college name>",
            "year": <graduation year as integer or null>,
            "cgpa": <cgpa as float or null>
        }}
    ],
    "experience": [
        {{
            "company": "<company name>",
            "role": "<job title>",
            "duration": "<e.g. Jan 2023 - May 2024>",
            "description": "<what they did in 1-2 sentences>",
            "skills_used": ["<skill1>"]
        }}
    ],
    "projects": [
        {{
            "name": "<project name>",
            "description": "<what it does in 1-2 sentences>",
            "tech_stack": ["<tech1>", "<tech2>"],
            "github_url": "<github link if present else empty string>"
        }}
    ],
    "achievements": ["<achievement1>", "<achievement2>"],
    "linkedin": "<linkedin profile URL or empty string>",
    "github": "<github profile URL or empty string>"
}}

Return ONLY the JSON object.
        """

        response = await _generate_content(model, prompt)
        text = _safe_text(response).strip()
        if not text:
            return {}
        clean_text = text
        if "```" in clean_text:
            match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", clean_text, re.DOTALL)
            if match:
                clean_text = match.group(1)
            else:
                parts = clean_text.split("```")
                clean_text = parts[1] if len(parts) > 1 else clean_text
                if clean_text.startswith("json"):
                    clean_text = clean_text[4:]
        brace_match = re.search(r"(\{.*\})", clean_text, re.DOTALL)
        if brace_match:
            clean_text = brace_match.group(1)
        return json.loads(clean_text)
    except Exception as e:
        logger.error(f"Gemini extract_resume_data error: {e}")
        return {}



async def improve_resume(resume_text: str) -> dict:
    """Generate specific, contextual AI resume improvement suggestions"""
    model = _get_model(use_flash=True)
    if not model:
        raise AIServiceUnavailable("AI resume review is unavailable. Check the Gemini configuration and try again.")

    try:
        prompt = f"""You are a senior technical recruiter who has reviewed thousands of software engineering resumes.
Analyze this resume and return a detailed, SPECIFIC improvement report. Every issue and suggestion must reference the actual content from the resume — no generic advice.

Resume:
{resume_text[:4000]}

Rules:
1. Read the actual bullet points, project names, and role descriptions from the resume above.
2. For "issues": point out SPECIFIC weak lines. Example: "The bullet 'Worked on backend' has no measurable impact — add response time improvement or scale handled."
3. For "specific_improvements": quote the EXACT current text and show a rewritten version.
4. For "keyword_suggestions": only suggest keywords genuinely absent from the resume that match the candidate's apparent field (infer from their skills/projects).
5. ATS score: calculate based on action verbs, quantified achievements, clear section headers, and keyword density.
6. Do NOT give generic tips like "use action verbs" without pointing to a specific bullet that lacks them.
7. Do NOT suggest "keep to 1-2 pages" — modern resumes are judged on quality not page count.

Return ONLY valid JSON:
{{
    "ats_score": <0-100 integer>,
    "overall_grade": "<A/B/C/D>",
    "issues": [
        "<Specific issue referencing actual resume content>",
        "<Another specific issue>"
    ],
    "keyword_suggestions": ["<keyword genuinely missing from this resume>"],
    "section_scores": {{"summary": <0-100>, "experience": <0-100>, "skills": <0-100>, "education": <0-100>, "projects": <0-100>}},
    "specific_improvements": [
        {{
            "section": "<section name>",
            "current": "<exact quote from resume>",
            "suggestion": "<rewritten version with metrics/impact>"
        }}
    ]
}}
"""
        response = await _generate_content(model, prompt)
        text = _safe_text(response).strip()
        if not text:
            raise AIServiceUnavailable("Gemini returned an empty resume review. Please try again.")
        # Clean markdown code fences if present
        if "```" in text:
            match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
            if match:
                text = match.group(1)
            else:
                text = text.replace("```json", "").replace("```", "").strip()
        brace_match = re.search(r"(\{.*\})", text, re.DOTALL)
        if brace_match:
            text = brace_match.group(1)
        return json.loads(text)
    except AIServiceUnavailable:
        raise
    except ResourceExhausted as e:
        raise AIServiceUnavailable(
            "Gemini request quota is exhausted on both configured models. Try again after quota reset.",
            status_code=429,
        ) from e
    except Exception as e:
        logger.error(f"Gemini improve_resume error: {e}")
        raise AIServiceUnavailable("Gemini could not review this resume. Please try again shortly.") from e



async def generate_cover_letter(resume_text: str, job: dict) -> str:
    """Generate tailored cover letter"""
    model = _get_model(use_flash=True)
    if not model:
        raise AIServiceUnavailable("AI cover-letter generation is unavailable. Check the Gemini configuration and try again.")
    if not (resume_text or "").strip():
        raise ValueError("This resume has no readable text. Upload a text-based PDF or DOCX and try again.")

    try:
        resume_summary = (resume_text or "")[:2500]
        job_title = job.get("title") or "Software Engineer"
        company = job.get("company") or "Hiring Team"
        description = (job.get("description") or "")[:1000]

        skills_raw = job.get("skills_required") or []
        if isinstance(skills_raw, list):
            skills_str = ", ".join(str(s) for s in skills_raw if s)
        else:
            skills_str = str(skills_raw)

        prompt = f"""
Write a professional, compelling, and tailored 3-paragraph cover letter for this job application.

Candidate Resume Details:
{resume_summary}

Target Job Details:
Role / Title: {job_title}
Company: {company}
Description: {description}
Key Skills / Requirements: {skills_str}

Guidelines:
- Highlight the candidate's relevant skills, projects, and experiences that match the job.
- Sound enthusiastic, professional, and confident.
- Do NOT use generic placeholder brackets like [Your Name] or [Insert Date] if the candidate's name or background can be inferred from the resume.
- Return ONLY the final cover letter text.
        """
        response = await _generate_content(model, prompt)
        text = _safe_text(response).strip()
        if not text:
            raise AIServiceUnavailable("Gemini returned an empty cover letter. Please try again.")
        return text
    except AIServiceUnavailable:
        raise
    except ResourceExhausted as e:
        logger.warning("Gemini cover-letter quota exhausted: %s", e)
        raise AIServiceUnavailable(
            "Gemini request quota is exhausted on both configured models. Try again after quota reset or review billing in Google AI Studio.",
            status_code=429,
        ) from e
    except Exception as e:
        logger.error(f"Gemini cover letter error: {e}", exc_info=True)
        raise AIServiceUnavailable("Gemini could not generate this cover letter. Please try again shortly.") from e


# ── Interview Features ───────────────────────────────────────────────────────

async def generate_interview_questions(
    profile: dict, job: Optional[dict], interview_type: str,
    difficulty: str, target_role: Optional[str], num_questions: int
) -> list:
    """Generate highly contextual, role-specific interview questions"""
    interview_type = getattr(interview_type, "value", interview_type)
    difficulty = getattr(difficulty, "value", difficulty)
    role = (job or {}).get("title") or target_role or "the target role"
    fallback = {
        "technical": [
            f"Which data structure would you use for a high-throughput {role} feature, and why?",
            f"Walk through how you would debug a slow API used by a {role} team.",
            "How would you test a function that handles invalid input and concurrent requests?",
            "Describe a technical trade-off you made in a project and how you measured the outcome.",
            "How would you investigate and fix a production bug that you cannot reproduce locally?",
        ],
        "system_design": [
            f"Design a service relevant to {role}; clarify requirements and estimate scale first.",
            "How would you design a rate limiter for a public API? Discuss storage and failure modes.",
            "How would you keep data consistent when two services update the same record?",
            "Where would you add caching, and how would you handle invalidation?",
            "What would you monitor, and how would your design change at ten times the traffic?",
        ],
        "behavioral": [
            "Tell me about a time you disagreed with a teammate. What did you do and what changed?",
            "Describe a deadline you were at risk of missing. How did you prioritize and communicate?",
            "Give an example of feedback you received and how you acted on it.",
            "Tell me about a project that failed. What did you learn and change afterward?",
            "Describe a time you helped someone else succeed without formal authority.",
        ],
        "hr": [
            f"Why are you interested in {role}, and what evidence shows you are prepared?",
            "Which type of team and work environment helps you do your best work?",
            "What is one skill you are developing now, and how are you measuring progress?",
            "Tell me about a difficult professional decision and how you made it.",
            "What questions would you ask a hiring manager before accepting this role?",
        ],
    }
    base = fallback.get(interview_type, fallback["technical"])
    follow_ups = [
        "What assumptions would you validate before committing to your approach?",
        "How would you measure whether your solution was successful?",
        "What would you change if you had half the available time?",
        "Describe the biggest risk in your approach and how you would mitigate it.",
        "How would you explain this decision to a teammate with a different perspective?",
    ]
    fallback_questions = (base + follow_ups)[:num_questions]
    model = _get_model(use_flash=True)
    if not model:
        return fallback_questions

    try:
        job_title = job.get("title") if job else target_role or "Software Developer"
        company = job.get("company") if job else "a tech company"
        candidate_skills_list = profile.get("skills") or []
        candidate_skills = ', '.join([s for s in candidate_skills_list[:15] if isinstance(s, str)]) or "Not specified"
        job_skills_list = (job.get("skills_required") or []) if job else []
        job_skills = ', '.join([s for s in job_skills_list[:15] if isinstance(s, str)]) if job else ""
        jd_text = (job.get("description") or "")[:1500] if job else ""

        # Infer skills gap: what the job requires that the candidate lacks
        candidate_skill_set = set(str(s).lower() for s in candidate_skills_list if s)
        required_skill_set = set(str(s).lower() for s in job_skills_list if s)
        missing_skills = list(required_skill_set - candidate_skill_set)[:5]
        missing_str = ', '.join(missing_skills) if missing_skills else "None identified"

        type_guidance = {
            "technical": "Focus on coding problems, data structures, algorithms, system concepts, and hands-on technical depth relevant to the role.",
            "behavioral": "Focus on past experiences, teamwork, conflict resolution, leadership, and situational judgment using STAR-format questions.",
            "system_design": "Focus on designing scalable systems, architecture trade-offs, database choices, API design, and distributed systems concepts.",
            "hr": "Focus on motivation, culture fit, career goals, salary expectations, and understanding the candidate's professional trajectory.",
        }.get(interview_type, "Ask comprehensive questions across technical and behavioral dimensions.")

        prompt = f"""You are an experienced technical interviewer at {company} hiring for the role: {job_title}.

You must generate exactly {num_questions} {difficulty}-difficulty {interview_type} interview questions.

Candidate Profile:
- Name: {profile.get('full_name', 'Candidate')}
- Listed Skills: {candidate_skills}
- Missing/Gap Skills for this role: {missing_str}

Job Context:
- Role: {job_title} at {company}
- Required Skills: {job_skills}
- Job Description Excerpt: {jd_text}

Interview focus: {type_guidance}

Rules:
1. Make questions SPECIFIC to this role and company — not generic.
2. Reference real concepts required for {job_title} work.
3. Probe the candidate's gap skills: {missing_str}.
4. For {difficulty} difficulty, calibrate depth accordingly.
5. Do NOT ask generic questions like "Tell me your strengths" unless it's an HR round.

Return ONLY a JSON array of {num_questions} question strings. No numbering, no markdown, no extra text.
Example format: ["Question 1?", "Question 2?"]
"""
        response = await _generate_content(model, prompt)
        text = _safe_text(response).strip()
        if not text:
            return fallback_questions
        # Extract JSON array from response
        arr_match = re.search(r'(\[.*?\])', text, re.DOTALL)
        if arr_match:
            text = arr_match.group(1)
        else:
            text = text.strip('`').strip()
            if text.startswith('json'):
                text = text[4:].strip()
        questions = json.loads(text)
        if not isinstance(questions, list):
            return fallback_questions
        questions = [q.strip() for q in questions if isinstance(q, str) and q.strip()]
        return questions[:num_questions] if len(questions) >= num_questions else fallback_questions
    except Exception as e:
        logger.error(f"Gemini question generation error: {e}")
        return fallback_questions


async def evaluate_interview_answer(question: str, answer: str, interview_type: str) -> dict:
    """Evaluate an interview answer and provide feedback"""
    def basic_feedback(reason: str = "AI evaluation is unavailable") -> dict:
        words = answer.split()
        has_example = any(term in answer.lower() for term in ("for example", "in my project", "when i", "we built", "i built"))
        has_outcome = any(term in answer.lower() for term in ("result", "improved", "reduced", "increased", "%", "measured"))
        return {
            "score": 0,
            "feedback": f"Basic structure check only; {reason}. Review whether your answer directly addresses the question and explains your reasoning.",
            "strengths": ["You provided a substantial response"] if len(words) >= 40 else [],
            "improvements": (["Add a concrete example"] if not has_example else []) + (["Explain the outcome or trade-off"] if not has_outcome else []),
            "ideal_answer_hints": ["State your approach, support it with an example, and explain the result."],
            "evaluation_mode": "basic",
        }
    model = _get_model(use_flash=True)
    if not model:
        return basic_feedback("Gemini is not configured on the backend")

    try:
        prompt = f"""
        Evaluate this interview answer for a {interview_type} interview. Return as JSON:
        
        Question: {question}
        Answer: {answer}
        
        Return JSON:
        {{
            "score": <0-100>,
            "feedback": "<specific feedback grounded in the answer>",
            "strengths": ["<strength1>"],
            "improvements": ["<improvement1>"],
            "ideal_answer_hints": ["<hint1>"]
        }}
        
        Return ONLY valid JSON.
        """
        response = await _generate_content(model, prompt)
        text = _safe_text(response).strip().strip("```json").strip("```")
        if not text:
            return basic_feedback()
        result = json.loads(text)
        result["score"] = max(0, min(100, int(result.get("score", 0))))
        result["evaluation_mode"] = "ai"
        return result
    except ResourceExhausted as e:
        logger.warning("Gemini answer-evaluation quota exhausted: %s", e)
        return basic_feedback("Gemini request quota is exhausted")
    except Exception as e:
        logger.error(f"Gemini answer evaluation error: {e}")
        return basic_feedback()


async def generate_interview_summary(interview_data: dict) -> dict:
    """Generate comprehensive interview feedback report"""
    responses = interview_data.get("responses") or []
    scores = []
    for response in responses:
        evaluation = response.get("evaluation") or {}
        if evaluation.get("evaluation_mode") == "basic":
            continue
        score = int(evaluation.get("score", 0))
        if not evaluation.get("evaluation_mode") and 0 < score <= 10:
            score *= 10  # Sessions created before the rubric used a 1-10 scale.
        scores.append(max(0, min(100, score)))
    average = round(sum(scores) / len(scores)) if scores else 0
    basic = {
        "overall_score": average,
        "confidence_score": average,
        "communication_score": average,
        "technical_accuracy_score": average,
        "strengths": list(dict.fromkeys(s for r in responses for s in r.get("evaluation", {}).get("strengths", [])))[:4],
        "improvements": list(dict.fromkeys(s for r in responses for s in r.get("evaluation", {}).get("improvements", [])))[:4],
        "overall_recommendation": "Review your answer-level feedback and practice the weakest question again. Scores are practice guidance, not hiring predictions.",
    }
    if not scores:
        basic["overall_recommendation"] = "AI scoring was unavailable for this session. Review the writing checklist and try another practice round when Gemini is available."
        return basic
    model = _get_model()
    if not model:
        return basic
    try:
        qa_summary = "\n".join([
            f"Q: {r['question']}\nA: {r['answer']}\nScore: "
            + ("Not scored" if r.get("evaluation", {}).get("evaluation_mode") == "basic" else f"{r.get('evaluation', {}).get('score', 'N/A')}/100")
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
        response = await _generate_content(model, prompt)
        text = _safe_text(response).strip().strip("```json").strip("```")
        if not text:
            return basic
        result = json.loads(text)
        return {**basic, **result, "overall_score": average}
    except Exception as e:
        logger.error(f"Interview summary error: {e}")
        return basic


# ── Career & Recruiter Features ───────────────────────────────────────────────

async def career_guidance_chat(message: str, history: list, student_context: dict) -> str:
    """AI career guidance chatbot — concise, direct, student-profile-aware"""
    model = _get_model(use_flash=True)
    if not model:
        return "Gemini career guidance is unavailable. Please ask again after the AI service is configured."

    try:
        name = student_context.get("full_name") or "Student"
        skills = ', '.join(student_context.get("skills", [])[:15]) if student_context.get("skills") else "Not listed yet"
        cgpa = student_context.get("cgpa") if student_context.get("cgpa") is not None else "N/A"
        course = student_context.get("course") or "Engineering"
        university = student_context.get("university") or "University"
        grad_year = student_context.get("graduation_year") or "N/A"
        projects = student_context.get("projects") or []
        project_names = [p.get("title") or p.get("name", "") for p in projects if isinstance(p, dict)] if projects else []
        proj_str = ', '.join(project_names[:5]) if project_names else "None listed yet"
        experience = student_context.get("experience") or []
        exp_str = ', '.join([e.get("company", "") for e in experience[:3] if isinstance(e, dict)]) or "No experience listed"
        bio = student_context.get("bio") or ""

        system_context = f"""You are a sharp, concise career mentor on Placify. The student's REAL profile from the database:
- Name: {name}
- University: {university} | Course: {course} | Grad Year: {grad_year}
- CGPA: {cgpa}/10
- Skills: {skills}
- Projects: {proj_str}
- Experience: {exp_str}
- Bio: {bio}

CRITICAL RULES:
1. Answer ONLY what was asked — no unsolicited advice, no padding.
2. Be SHORT and DIRECT. Use bullet points for lists. Max 150 words unless the question needs more detail.
3. Reference the student's actual profile data above when relevant (e.g. their real skills, CGPA, projects).
4. Never give generic advice — personalize to this student's situation.
5. If you don't have enough data to answer precisely, say so briefly and ask a follow-up."""

        # Format recent history
        history_text = ""
        if history and isinstance(history, list):
            recent_turns = history[-6:]
            formatted_turns = []
            for item in recent_turns:
                if isinstance(item, dict):
                    role = item.get("role") or item.get("sender") or "User"
                    content = item.get("content") or item.get("message") or item.get("text") or ""
                    if content:
                        formatted_turns.append(f"{role.capitalize()}: {content}")
            if formatted_turns:
                history_text = "Previous messages:\n" + "\n".join(formatted_turns) + "\n\n"

        full_prompt = f"{system_context}\n\n{history_text}Student: {message}\nMentor:"
        response = await _generate_content(model, full_prompt)
        text = _safe_text(response)
        if not text:
            return "I couldn't generate a response. Please try rephrasing."
        return text.strip()
    except Exception as e:
        logger.error(f"Career guidance error: {e}")
        return "Career guidance is temporarily unavailable. Please try again."


async def analyze_resume_vs_job(resume_text: str, resume_data: dict, job: dict) -> dict:
    """Deep resume vs job analysis"""
    model = _get_model(use_flash=True)
    if not model:
        raise AIServiceUnavailable("AI resume matching is unavailable. Check the Gemini configuration and try again.")

    try:
        skills_req = [str(s) for s in (job.get("skills_required") or []) if s]
        resume_skills = [str(s) for s in (resume_data.get("skills", []) if resume_data else []) if s]
        prompt = f"""
        Analyze how well this resume matches the job. Return JSON:
        
        Resume Skills: {', '.join(resume_skills)}
        Resume Text (first 1000 chars): {(resume_text or '')[:1000]}
        
        Job: {job.get('title')} at {job.get('company')}
        Required Skills: {', '.join(skills_req)}
        Description: {(job.get('description') or '')[:500]}
        
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
        response = await _generate_content(model, prompt)
        text = _safe_text(response).strip().strip("```json").strip("```")
        if not text:
            raise AIServiceUnavailable("Gemini returned an empty resume match analysis. Please try again.")
        return json.loads(text)
    except AIServiceUnavailable:
        raise
    except ResourceExhausted as e:
        raise AIServiceUnavailable(
            "Gemini request quota is exhausted on both configured models. Try again after quota reset.",
            status_code=429,
        ) from e
    except Exception as e:
        logger.error(f"Resume vs job analysis error: {e}")
        raise AIServiceUnavailable("Gemini could not analyze this resume against the job. Please try again shortly.") from e


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
        response = await _generate_content(model, prompt)
        text = _safe_text(response).strip().strip("```json").strip("```")
        if not text:
            return {"students": [], "message": "AI could not parse query. Try a different search term."}
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
    if settings.enable_ml_features:
        try:
            from ml.placement_predictor import get_predictor
            result = get_predictor().predict(profile)
            raw = result.get("raw_features", {})
            result["factors"] = {
                "skills": raw.get("skills_count", 0),
                "cgpa": raw.get("cgpa", 0),
                "projects": raw.get("projects_count", 0),
                "experience": raw.get("work_experience_count", 0),
                "backlogs": raw.get("active_backlogs", 0),
                "mock_interview": raw.get("mock_interview_score", 0),
            }
            improvements = []
            if raw.get("skills_count", 0) < 5:
                improvements.append("Add role-relevant technical skills and demonstrate them in projects")
            if raw.get("projects_count", 0) < 3:
                improvements.append("Build and document at least three portfolio projects")
            if raw.get("work_experience_count", 0) < 1:
                improvements.append("Add an internship, freelance assignment, or practical experience")
            if raw.get("active_backlogs", 0) > 0:
                improvements.append("Prioritize clearing active backlogs")
            if raw.get("mock_interview_score", 0) < 70:
                improvements.append("Practice mock interviews and review the feedback")
            result["top_improvements"] = improvements[:3]
            result["model"] = "random_forest_v2"
            return result
        except Exception as exc:
            logger.warning("ML placement prediction unavailable; using deterministic fallback: %s", exc)
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
        improvements.append(f"Complete your profile (currently {profile_completion}%)")

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
