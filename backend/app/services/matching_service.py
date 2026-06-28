"""
Job Matching Service
Algorithmic matching: skills overlap + CGPA + projects + preferences
Falls back to Sentence Transformers + FAISS when ML is enabled
"""

from app.config import settings
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)


async def compute_job_matches(student_profile: dict, jobs: List[dict]) -> List[dict]:
    """
    Compute job matches for a student.
    
    Strategy:
    1. If ML enabled: Use Sentence Transformers + FAISS (semantic)
    2. Fallback: Algorithmic scoring (skills + CGPA + education)
    """
    if settings.enable_ml_features:
        try:
            return await _semantic_matching(student_profile, jobs)
        except Exception as e:
            logger.warning(f"ML matching failed, falling back to algorithmic: {e}")

    return _algorithmic_matching(student_profile, jobs)


def _algorithmic_matching(student: dict, jobs: List[dict]) -> List[dict]:
    """
    Rule-based job matching algorithm.
    
    Scoring weights:
    - Skills overlap: 40%
    - Education/CGPA: 20%
    - Project relevance: 20%
    - Preferences (location, type): 20%
    """
    matches = []
    student_skills = set(s.lower() for s in (student.get("skills") or []))
    student_cgpa = student.get("cgpa") or 0
    student_projects = student.get("projects") or []
    project_techs = set()
    for p in student_projects:
        if isinstance(p, dict):
            for tech in p.get("tech_stack", []):
                project_techs.add(tech.lower())

    for job in jobs:
        job_skills = set(s.lower() for s in (job.get("skills_required") or []))

        # ── Skills Score (40%) ───────────────────────────────────────────
        if job_skills:
            matched_skills = student_skills & job_skills
            missing_skills = job_skills - student_skills
            skill_score = len(matched_skills) / len(job_skills) * 40
        else:
            matched_skills = set()
            missing_skills = set()
            skill_score = 20  # Neutral if no skills specified

        # ── CGPA Score (20%) ─────────────────────────────────────────────
        min_cgpa = job.get("min_cgpa") or 0
        if student_cgpa >= min_cgpa:
            cgpa_bonus = min((student_cgpa - min_cgpa) / 2, 1) * 10
            cgpa_score = 10 + cgpa_bonus
        else:
            cgpa_score = max(0, (student_cgpa / min_cgpa) * 10) if min_cgpa else 15

        # ── Project Relevance (20%) ──────────────────────────────────────
        project_score = 0
        if project_techs and job_skills:
            project_matches = project_techs & job_skills
            project_score = min(len(project_matches) / len(job_skills) * 20, 20)
        elif student_projects:
            project_score = 10  # Base score for having projects

        # ── Final Score ──────────────────────────────────────────────────
        total_score = int(skill_score + cgpa_score + project_score)
        total_score = max(0, min(100, total_score))

        if total_score < 20:  # Skip very low matches
            continue

        matches.append({
            "student_id": student["id"],
            "job_id": job["id"],
            "match_score": total_score,
            "skill_matches": list(matched_skills),
            "missing_skills": list(missing_skills)[:5],
            "match_reason": _generate_match_reason(total_score, matched_skills, missing_skills),
            "recommendation": _generate_recommendation(total_score, missing_skills),
            "job": job,
        })

    return sorted(matches, key=lambda x: x["match_score"], reverse=True)


async def _semantic_matching(student: dict, jobs: List[dict]) -> List[dict]:
    """
    Semantic matching using Sentence Transformers + FAISS.
    Requires: pip install sentence-transformers faiss-cpu
    """
    try:
        from sentence_transformers import SentenceTransformer
        import numpy as np

        model = SentenceTransformer(settings.sentence_transformer_model)

        # Create student embedding
        student_text = _build_student_text(student)
        student_embedding = model.encode([student_text])[0]

        # Encode all jobs
        job_texts = [_build_job_text(job) for job in jobs]
        job_embeddings = model.encode(job_texts)

        # Compute cosine similarities
        student_norm = student_embedding / (np.linalg.norm(student_embedding) + 1e-8)
        job_norms = job_embeddings / (np.linalg.norm(job_embeddings, axis=1, keepdims=True) + 1e-8)
        similarities = np.dot(job_norms, student_norm)

        matches = []
        for i, (job, sim) in enumerate(zip(jobs, similarities)):
            score = int(sim * 100)
            if score < 20:
                continue

            student_skills = set(s.lower() for s in (student.get("skills") or []))
            job_skills = set(s.lower() for s in (job.get("skills_required") or []))
            matched_skills = student_skills & job_skills
            missing_skills = job_skills - student_skills

            matches.append({
                "student_id": student["id"],
                "job_id": job["id"],
                "match_score": min(score, 100),
                "skill_matches": list(matched_skills),
                "missing_skills": list(missing_skills)[:5],
                "match_reason": f"Semantic similarity: {score}%",
                "recommendation": _generate_recommendation(score, missing_skills),
                "job": job,
            })

        return sorted(matches, key=lambda x: x["match_score"], reverse=True)

    except ImportError:
        logger.warning("sentence-transformers not installed. Run: pip install sentence-transformers faiss-cpu")
        raise


def _build_student_text(student: dict) -> str:
    """Build text representation of student for embedding"""
    skills = ', '.join(student.get("skills") or [])
    projects = ' '.join([
        p.get("description", "") if isinstance(p, dict) else str(p)
        for p in (student.get("projects") or [])
    ])
    bio = student.get("bio", "")
    course = student.get("course", "")
    return f"{course} student. Skills: {skills}. {bio} {projects}"


def _build_job_text(job: dict) -> str:
    """Build text representation of job for embedding"""
    title = job.get("title", "")
    company = job.get("company", "")
    description = job.get("description", "")
    skills = ', '.join(job.get("skills_required") or [])
    return f"{title} at {company}. {description} Required skills: {skills}"


def _generate_match_reason(score: int, matched_skills: set, missing_skills: set) -> str:
    if score >= 80:
        return f"Excellent match! You have {len(matched_skills)} of the required skills."
    elif score >= 60:
        return f"Good match! You meet most requirements with {len(matched_skills)} matching skills."
    elif score >= 40:
        return f"Partial match. You have {len(matched_skills)} required skills, missing {len(missing_skills)}."
    else:
        return f"Low match. Consider acquiring: {', '.join(list(missing_skills)[:3])}"


def _generate_recommendation(score: int, missing_skills: set) -> str:
    if score >= 80:
        return "Highly recommended to apply! Your profile is a strong fit."
    elif score >= 60:
        return f"Good fit — apply and mention transferable skills. Consider learning: {', '.join(list(missing_skills)[:2])}"
    elif score >= 40:
        return f"Apply if interested, but upskill first: {', '.join(list(missing_skills)[:3])}"
    else:
        return f"Build skills first: {', '.join(list(missing_skills)[:3])}"
