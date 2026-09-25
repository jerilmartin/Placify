"""Consistent course/branch matching for campus drives and direct jobs."""

import re
from typing import Any


def _normalise(value: str) -> str:
    return " ".join(re.findall(r"[a-z0-9]+", (value or "").casefold()))


_FAMILIES = {
    "computer_science": ("computer science", "computer engineering", "comp sci", "cse", "cs"),
    "information_technology": ("information technology", "info tech", "it"),
    "electronics_communication": ("electronics and communication", "electronics communication", "electronic communication", "telecommunication", "ece", "ec"),
    "electrical_electronics": ("electrical and electronics", "electrical electronics", "electrical engineering", "electrical", "eee", "ee"),
    "mechanical": ("mechanical", "mech", "me"),
    "civil": ("civil", "ce"),
    "chemical": ("chemical", "chem", "ch"),
    "artificial_intelligence": ("artificial intelligence", "machine learning", "ai ml", "aiml", "ai", "ml"),
    "data_science": ("data science", "data analytics", "analytics", "ds"),
    "cybersecurity": ("cyber security", "cybersecurity", "information assurance", "infosec"),
}


def _contains_phrase(text: str, phrase: str) -> bool:
    return f" {phrase} " in f" {text} "


def _families(value: str) -> set[str]:
    normalised = _normalise(value)
    return {
        family
        for family, aliases in _FAMILIES.items()
        if any(_contains_phrase(normalised, alias) for alias in aliases)
    }


def matches_branch(student_course: str, required_branch: str) -> bool:
    """Match degree variants by discipline, never by arbitrary substrings."""
    course = _normalise(student_course)
    required = _normalise(required_branch)
    if not course or not required:
        return False
    if required in {"all", "any", "all branches", "all branches any degree"}:
        return True
    if required == "all engineering branches":
        return bool(_families(course) & {
            "computer_science", "information_technology", "electronics_communication",
            "electrical_electronics", "mechanical", "civil", "chemical",
        }) or _contains_phrase(course, "engineering")

    course_families = _families(course)
    required_families = _families(required)
    if required_families:
        return bool(course_families & required_families)
    # Support an unrecognised discipline such as Physics within a degree title.
    # Keep token boundaries so short abbreviations never match inside other words.
    return _contains_phrase(course, required)


def is_eligible_for_drive(student: dict[str, Any], eligibility: dict[str, Any]) -> bool:
    """Evaluate one stored student profile against every declared drive criterion."""
    minimum = eligibility.get("min_cgpa")
    if minimum is not None and (student.get("cgpa") is None or float(student["cgpa"]) < float(minimum)):
        return False
    maximum = eligibility.get("max_backlogs")
    if maximum is not None and int(student.get("active_backlogs") or 0) > int(maximum):
        return False
    year = eligibility.get("graduation_year")
    if year is not None and (student.get("graduation_year") is None or int(student["graduation_year"]) != int(year)):
        return False
    branches = eligibility.get("eligible_branches") or []
    if branches and not any(matches_branch(student.get("course") or "", branch) for branch in branches):
        return False
    return True
