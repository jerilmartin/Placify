"""
Resume parsing service
Handles PDF/DOCX text extraction
"""

import io
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def parse_resume_pdf(file_content: bytes, filename: str) -> str:
    """
    Extract text from uploaded resume file.
    Supports: PDF (via pdfplumber), DOCX (via python-docx)
    """
    text = ""
    filename_lower = filename.lower()

    try:
        if filename_lower.endswith(".pdf"):
            text = _extract_pdf_text(file_content)
        elif filename_lower.endswith(".docx"):
            text = _extract_docx_text(file_content)
        elif filename_lower.endswith(".doc"):
            # .doc needs additional library (python-docx2txt)
            text = _extract_doc_text(file_content)
        else:
            text = file_content.decode("utf-8", errors="ignore")
    except Exception as e:
        logger.error(f"Resume parse error for {filename}: {e}")
        text = ""

    return text.strip()


def _extract_pdf_text(content: bytes) -> str:
    """Extract text from PDF using pdfplumber (primary) or PyPDF2 (fallback)"""
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            pages = []
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    pages.append(page_text)
            return "\n".join(pages)
    except ImportError:
        logger.warning("pdfplumber not installed, trying PyPDF2")
    except Exception as e:
        logger.error(f"pdfplumber error: {e}")

    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(content))
        pages = [page.extract_text() for page in reader.pages if page.extract_text()]
        return "\n".join(pages)
    except Exception as e:
        logger.error(f"PyPDF2 error: {e}")
        return ""


def _extract_docx_text(content: bytes) -> str:
    """Extract text from DOCX"""
    try:
        from docx import Document
        doc = Document(io.BytesIO(content))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs)
    except ImportError:
        logger.warning("python-docx not installed")
        return ""
    except Exception as e:
        logger.error(f"DOCX extraction error: {e}")
        return ""


def _extract_doc_text(content: bytes) -> str:
    """Extract text from legacy .doc format"""
    try:
        import docx2txt
        return docx2txt.process(io.BytesIO(content))
    except ImportError:
        logger.warning("docx2txt not installed")
        return ""
    except Exception as e:
        logger.error(f"DOC extraction error: {e}")
        return ""


def calculate_ats_score(resume_text: str, job: Optional[dict] = None) -> dict:
    """
    Calculate ATS (Applicant Tracking System) score.
    If job provided, scores against job requirements.
    Otherwise, does general ATS analysis.
    """
    if not resume_text:
        return {"ats_score": 0, "message": "No resume text found"}

    text_lower = resume_text.lower()
    score = 0
    issues = []
    keyword_matches = []

    # ── Section detection ─────────────────────────────────────────────────────
    sections = {
        "contact": any(k in text_lower for k in ["email", "phone", "linkedin", "github"]),
        "education": any(k in text_lower for k in ["education", "degree", "university", "college", "b.tech", "b.e"]),
        "skills": any(k in text_lower for k in ["skills", "technologies", "technical"]),
        "experience": any(k in text_lower for k in ["experience", "work", "internship", "employment"]),
        "projects": any(k in text_lower for k in ["project", "developed", "built", "implemented"]),
    }

    for section, found in sections.items():
        if found:
            score += 10
        else:
            issues.append(f"Missing {section} section")

    # ── Job keyword matching ───────────────────────────────────────────────────
    if job:
        required_skills = job.get("skills_required", [])
        matched = [s for s in required_skills if s.lower() in text_lower]
        keyword_matches = matched
        missing = [s for s in required_skills if s.lower() not in text_lower]

        if required_skills:
            keyword_score = len(matched) / len(required_skills) * 50
            score += keyword_score

        if missing:
            issues.append(f"Missing keywords: {', '.join(missing[:5])}")
    else:
        # General keyword check
        common_keywords = ["python", "java", "javascript", "sql", "git", "agile", "rest api"]
        matched = [k for k in common_keywords if k in text_lower]
        score += len(matched) * 3

    # ── Length check ──────────────────────────────────────────────────────────
    word_count = len(resume_text.split())
    if word_count < 200:
        issues.append("Resume too short (add more detail)")
        score -= 5
    elif word_count > 800:
        issues.append("Resume too long (trim to 1-2 pages)")
        score -= 3

    final_score = max(0, min(100, int(score)))

    return {
        "ats_score": final_score,
        "grade": "A" if final_score >= 80 else "B" if final_score >= 60 else "C" if final_score >= 40 else "D",
        "sections_found": sections,
        "keyword_matches": keyword_matches,
        "issues": issues,
        "word_count": word_count,
        "tips": [
            "Use standard section headings",
            "Include quantified achievements",
            "Match keywords from job description",
            "Keep to 1-2 pages",
        ]
    }
