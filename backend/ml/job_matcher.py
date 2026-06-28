"""
ML Job Matcher — Sentence Transformers + FAISS
Semantic resume-to-job matching

Install ML deps: pip install -r requirements-ml.txt
"""

import numpy as np
import logging
import os
import json
from typing import List, Optional
from pathlib import Path

logger = logging.getLogger(__name__)


class JobMatcher:
    """
    Semantic job matching using Sentence Transformers + FAISS vector search.
    
    Workflow:
    1. Encode all job descriptions into vector embeddings
    2. Store in FAISS index for fast similarity search
    3. Encode student profile → query the FAISS index
    4. Return top-N matching jobs with similarity scores
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2", index_path: Optional[str] = None):
        self.model_name = model_name
        self.index_path = index_path or "./models/jobs_faiss.index"
        self.meta_path = self.index_path.replace(".index", "_meta.json")
        self.model = None
        self.index = None
        self.job_metadata: List[dict] = []
        self._initialized = False

    def _lazy_init(self):
        """Lazy-load heavy dependencies"""
        if self._initialized:
            return

        try:
            from sentence_transformers import SentenceTransformer
            import faiss
            self.model = SentenceTransformer(self.model_name)
            logger.info(f"✅ Sentence Transformer loaded: {self.model_name}")
            self._initialized = True
        except ImportError as e:
            logger.error(
                "ML dependencies not installed. Run: pip install sentence-transformers faiss-cpu\n"
                f"Error: {e}"
            )
            raise

    def build_index(self, jobs: List[dict]) -> None:
        """
        Build FAISS index from job listings.
        Call this when jobs are added/updated.
        
        Args:
            jobs: List of job dicts with 'id', 'title', 'description', 'skills_required'
        """
        self._lazy_init()
        import faiss

        logger.info(f"Building FAISS index for {len(jobs)} jobs...")

        texts = [self._job_to_text(job) for job in jobs]
        embeddings = self.model.encode(texts, show_progress_bar=True, batch_size=32)
        embeddings = embeddings.astype(np.float32)

        # Normalize for cosine similarity
        faiss.normalize_L2(embeddings)

        dim = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dim)  # Inner product = cosine after normalization
        self.index.add(embeddings)
        self.job_metadata = [{"id": j["id"], "title": j.get("title"), "company": j.get("company")} for j in jobs]

        # Save to disk
        os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
        faiss.write_index(self.index, self.index_path)
        with open(self.meta_path, "w") as f:
            json.dump(self.job_metadata, f)

        logger.info(f"✅ FAISS index saved to {self.index_path}")

    def load_index(self) -> bool:
        """Load persisted FAISS index from disk"""
        if not os.path.exists(self.index_path):
            return False
        try:
            self._lazy_init()
            import faiss
            self.index = faiss.read_index(self.index_path)
            with open(self.meta_path) as f:
                self.job_metadata = json.load(f)
            logger.info(f"✅ FAISS index loaded ({self.index.ntotal} jobs)")
            return True
        except Exception as e:
            logger.error(f"Failed to load FAISS index: {e}")
            return False

    def match(self, student_profile: dict, top_k: int = 20) -> List[dict]:
        """
        Find top-k matching jobs for a student profile.
        
        Args:
            student_profile: Student profile dict with skills, bio, projects, etc.
            top_k: Number of top matches to return
            
        Returns:
            List of {job_id, title, company, similarity_score} sorted by score desc
        """
        if not self._initialized or self.index is None:
            if not self.load_index():
                raise RuntimeError("FAISS index not built. Call build_index() first.")

        student_text = self._student_to_text(student_profile)
        embedding = self.model.encode([student_text]).astype(np.float32)

        import faiss
        faiss.normalize_L2(embedding)

        scores, indices = self.index.search(embedding, min(top_k, self.index.ntotal))

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(self.job_metadata):
                continue
            meta = self.job_metadata[idx]
            results.append({
                "job_id": meta["id"],
                "title": meta.get("title"),
                "company": meta.get("company"),
                "semantic_score": round(float(score) * 100, 1),
            })

        return results

    def _job_to_text(self, job: dict) -> str:
        title = job.get("title", "")
        company = job.get("company", "")
        description = job.get("description", "")[:500]
        skills = ", ".join(job.get("skills_required") or [])
        return f"{title} at {company}. {description}. Required skills: {skills}"

    def _student_to_text(self, student: dict) -> str:
        skills = ", ".join(student.get("skills") or [])
        course = student.get("course", "")
        bio = student.get("bio", "")
        projects = " ".join([
            p.get("description", "") if isinstance(p, dict) else ""
            for p in (student.get("projects") or [])
        ])
        return f"{course} student. Skills: {skills}. {bio} {projects}"


# Global singleton
_matcher: Optional[JobMatcher] = None


def get_matcher() -> JobMatcher:
    global _matcher
    if _matcher is None:
        _matcher = JobMatcher()
    return _matcher
