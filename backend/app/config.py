"""
Application configuration using Pydantic Settings
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # ── App ───────────────────────────────────────────────
    app_name: str = "Campus Placement Management Platform"
    environment: str = "development"
    debug: bool = True
    secret_key: str = "changeme-use-a-strong-secret-in-production"

    # ── Supabase ──────────────────────────────────────────
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # ── Gemini AI ─────────────────────────────────────────
    gemini_api_key: str = ""
    gemini_model_pro: str = "gemini-2.5-pro"
    gemini_model_flash: str = "gemini-2.5-flash"

    # ── JWT ───────────────────────────────────────────────
    jwt_secret: str = "changeme-jwt-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # ── CORS ──────────────────────────────────────────────
    frontend_url: str = "http://localhost:3000"

    @property
    def allowed_origins(self) -> List[str]:
        return [
            self.frontend_url,
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
        ]

    # ── Storage ───────────────────────────────────────────
    max_file_size_mb: int = 10
    allowed_resume_types: List[str] = ["pdf", "doc", "docx"]

    # ── ML ────────────────────────────────────────────────
    ml_model_path: str = "./ml/models"
    sentence_transformer_model: str = "all-MiniLM-L6-v2"
    faiss_index_path: str = "./ml/models/jobs_faiss.index"
    enable_ml_features: bool = False  # Set True after ML setup

    # ── Server ────────────────────────────────────────────
    port: int = 8000

    # ── Rate Limiting ─────────────────────────────────────
    rate_limit_requests: int = 100
    rate_limit_window_seconds: int = 900  # 15 min

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"  # Silently ignore unknown env vars


settings = Settings()
