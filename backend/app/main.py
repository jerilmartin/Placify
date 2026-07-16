"""
Campus Placement Management Platform - FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging
import traceback

from app.config import settings
from app.routers import (
    auth,
    students,
    resumes,
    jobs,
    applications,
    interviews,
    recruiters,
    universities,
    mentors,
    analytics,
    notifications,
    ai,
)

from app.middleware.rate_limit import RateLimitMiddleware

# Configure enhanced logging format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s (%(filename)s:%(lineno)d): %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("placify.backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    logger.info("🚀 Placement Platform API starting up...")
    logger.info(f"   Environment: {settings.environment}")
    logger.info(f"   Debug mode: {settings.debug}")
    yield
    logger.info("📴 Placement Platform API shutting down...")



app = FastAPI(
    title="Campus Placement Management Platform API",
    description="""
    AI-powered Campus Placement Management Platform that unifies Students, Universities, 
    Recruiters, and Mentors into a single intelligent ecosystem.
    
    ## Features
    - 🎓 **Student Portal**: Resume parsing, job matching, AI interview coach, career guidance
    - 🏢 **Recruiter Portal**: Job posting, AI candidate shortlisting, interview scheduling
    - 🏫 **University Portal**: Placement drives, analytics, eligibility management
    - 👨‍🏫 **Mentor Portal**: Resume review, guidance sessions, progress tracking
    - 🤖 **AI Features**: Gemini-powered resume parsing, improvement, cover letter generation
    - 📊 **ML Features**: Semantic job matching (FAISS), placement risk prediction
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── Middleware ──────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    RateLimitMiddleware,
    limit=100,
    window_seconds=60,
)

# ── Routers ─────────────────────────────────────────────────────────────────
app.include_router(auth.router,          prefix="/api/auth",          tags=["Authentication"])
app.include_router(students.router,      prefix="/api/students",       tags=["Students"])
app.include_router(resumes.router,       prefix="/api/resumes",        tags=["Resumes"])
app.include_router(jobs.router,          prefix="/api/jobs",           tags=["Jobs"])
app.include_router(applications.router,  prefix="/api/applications",   tags=["Applications"])
app.include_router(interviews.router,    prefix="/api/interviews",     tags=["Interviews"])
app.include_router(recruiters.router,    prefix="/api/recruiters",     tags=["Recruiters"])
app.include_router(universities.router,  prefix="/api/universities",   tags=["Universities"])
app.include_router(mentors.router,       prefix="/api/mentors",        tags=["Mentors"])
app.include_router(analytics.router,     prefix="/api/analytics",      tags=["Analytics"])
app.include_router(notifications.router, prefix="/api/notifications",  tags=["Notifications"])
app.include_router(ai.router,            prefix="/api/ai",             tags=["AI Features"])


# ── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "ok",
        "service": "Campus Placement Management Platform API",
        "version": "1.0.0",
        "environment": settings.environment,
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "message": "Campus Placement Management Platform API",
        "docs": "/docs",
        "health": "/health",
    }
