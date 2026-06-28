"""
Profile Scoring Service
Computes profile completion % and profile strength breakdown
"""

from typing import Dict, Any


def calculate_profile_completion(profile: dict) -> int:
    """
    Calculate profile completion percentage.
    Used to show progress bar and encourage students to fill out their profiles.
    """
    weights = {
        "full_name":      5,
        "phone":          5,
        "location":       5,
        "bio":            5,
        "university":     5,
        "course":         5,
        "graduation_year":5,
        "cgpa":           5,
        "skills":         10,   # needs at least 3 skills
        "github_url":     5,
        "linkedin_url":   5,
        "portfolio_url":  5,
        "projects":       15,   # needs at least 1 project
        "work_experience":10,   # optional but boosts score
        "achievements":   5,
    }

    score = 0
    for field, weight in weights.items():
        value = profile.get(field)
        if value is None or value == "" or value == [] or value == {}:
            continue
        if field == "skills" and isinstance(value, list) and len(value) >= 3:
            score += weight
        elif field == "projects" and isinstance(value, list) and len(value) >= 1:
            score += weight
        elif field == "work_experience" and isinstance(value, list) and len(value) >= 1:
            score += weight
        elif field not in ("skills", "projects", "work_experience"):
            score += weight

    return min(score, 100)


def get_profile_strength_breakdown(profile: dict) -> dict:
    """
    Get detailed profile strength breakdown with tips.
    Similar to LinkedIn's profile strength meter.
    """
    sections = {
        "personal_details": {
            "label": "Personal Details",
            "weight": 20,
            "fields": ["full_name", "phone", "location", "bio"],
            "tips": ["Add a professional bio", "Include your phone number", "Add your location"],
        },
        "education": {
            "label": "Education",
            "weight": 20,
            "fields": ["university", "course", "graduation_year", "cgpa"],
            "tips": ["Add your CGPA", "Complete your education details"],
        },
        "projects": {
            "label": "Projects",
            "weight": 30,
            "fields": ["projects"],
            "tips": ["Add at least 3 projects", "Include GitHub links", "Describe your tech stack"],
        },
        "resume": {
            "label": "Resume",
            "weight": 20,
            "fields": ["github_url", "linkedin_url", "portfolio_url"],
            "tips": ["Add your GitHub profile", "Add your LinkedIn profile", "Upload a resume"],
        },
        "skills": {
            "label": "Skills",
            "weight": 10,
            "fields": ["skills"],
            "tips": ["Add at least 8 technical skills", "Include both core and soft skills"],
        },
    }

    results = []
    total_score = 0

    for key, section in sections.items():
        earned = 0
        max_score = section["weight"]
        fields = section["fields"]
        tips = []

        if key == "personal_details":
            filled = sum(1 for f in fields if profile.get(f))
            earned = round(filled / len(fields) * max_score)
            if not profile.get("bio"):
                tips.append("Add a professional summary/bio")
            if not profile.get("location"):
                tips.append("Add your location")

        elif key == "education":
            filled = sum(1 for f in fields if profile.get(f))
            earned = round(filled / len(fields) * max_score)
            if not profile.get("cgpa"):
                tips.append("Add your CGPA")

        elif key == "projects":
            projects = profile.get("projects") or []
            if len(projects) >= 3:
                earned = max_score
            elif len(projects) >= 1:
                earned = round(len(projects) / 3 * max_score)
                tips.append(f"Add {3 - len(projects)} more projects to maximize score")
            else:
                earned = 0
                tips.append("Add at least one project to boost your profile significantly")

        elif key == "resume":
            has_github = bool(profile.get("github_url"))
            has_linkedin = bool(profile.get("linkedin_url"))
            has_portfolio = bool(profile.get("portfolio_url"))
            filled = sum([has_github, has_linkedin, has_portfolio])
            earned = round(filled / 3 * max_score)
            if not has_github:
                tips.append("Add your GitHub profile link")
            if not has_linkedin:
                tips.append("Add your LinkedIn profile link")

        elif key == "skills":
            skills = profile.get("skills") or []
            if len(skills) >= 8:
                earned = max_score
            elif len(skills) >= 3:
                earned = round(len(skills) / 8 * max_score)
                tips.append(f"Add {8 - len(skills)} more skills")
            else:
                earned = round(len(skills) / 8 * max_score)
                tips.append("Add at least 8 technical skills")

        total_score += earned
        results.append({
            "section": key,
            "label": section["label"],
            "score": earned,
            "max_score": max_score,
            "percentage": round(earned / max_score * 100) if max_score else 0,
            "tips": tips,
        })

    overall_pct = min(total_score, 100)
    level = (
        "Beginner" if overall_pct < 30 else
        "Intermediate" if overall_pct < 60 else
        "Advanced" if overall_pct < 85 else
        "Expert"
    )

    return {
        "overall_score": overall_pct,
        "level": level,
        "sections": results,
        "next_milestone": _next_milestone(overall_pct),
    }


def _next_milestone(score: int) -> dict:
    milestones = [
        (30, "Beginner → Intermediate", "Complete your education and add skills"),
        (60, "Intermediate → Advanced", "Add 3+ projects and social profiles"),
        (85, "Advanced → Expert", "Add work experience and achievements"),
        (100, "Expert", "You're at maximum profile strength!"),
    ]
    for threshold, label, tip in milestones:
        if score < threshold:
            return {"target": threshold, "label": label, "tip": tip, "points_needed": threshold - score}
    return {"target": 100, "label": "Expert", "tip": "Keep your profile updated!", "points_needed": 0}
