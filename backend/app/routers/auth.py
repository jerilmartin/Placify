"""
Authentication router
Endpoints: /api/auth/register, /api/auth/login, /api/auth/logout,
           /api/auth/refresh, /api/auth/me
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models.user import UserCreate, UserLogin, UserResponse, TokenResponse, RefreshTokenRequest
from app.database import get_supabase_anon, get_supabase
from app.middleware.auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer(auto_error=False)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Register a new user.
    Supports roles: student, recruiter, university, mentor
    """
    supabase = get_supabase_anon()
    try:
        # Register with Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "full_name": user_data.full_name,
                    "role": user_data.role,
                    "university": user_data.university,
                    "student_id": user_data.student_id,
                }
            }
        })

        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed. Email may already be in use."
            )

        # TODO: Create role-specific profile in DB
        # e.g., student_profiles, recruiter_profiles, etc.

        return TokenResponse(
            access_token=auth_response.session.access_token if auth_response.session else "",
            refresh_token=auth_response.session.refresh_token if auth_response.session else None,
            user=UserResponse(
                id=auth_response.user.id,
                email=auth_response.user.email,
                full_name=user_data.full_name,
                role=user_data.role,
                created_at=auth_response.user.created_at,
            )
        )
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login with email and password"""
    supabase = get_supabase_anon()
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password,
        })

        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        user_meta = auth_response.user.user_metadata or {}
        return TokenResponse(
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token,
            user=UserResponse(
                id=auth_response.user.id,
                email=auth_response.user.email,
                full_name=user_meta.get("full_name", ""),
                role=user_meta.get("role", "student"),
                created_at=auth_response.user.created_at,
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Login failed")


@router.post("/logout")
async def logout(current_user=Depends(get_current_user)):
    """Logout current user"""
    supabase = get_supabase_anon()
    try:
        supabase.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return {"message": "Logged out"}


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshTokenRequest):
    """Refresh access token"""
    supabase = get_supabase_anon()
    try:
        auth_response = supabase.auth.refresh_session(body.refresh_token)
        if not auth_response.session:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

        user_meta = auth_response.user.user_metadata or {}
        return TokenResponse(
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token,
            user=UserResponse(
                id=auth_response.user.id,
                email=auth_response.user.email,
                full_name=user_meta.get("full_name", ""),
                role=user_meta.get("role", "student"),
                created_at=auth_response.user.created_at,
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token refresh failed")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    """Get current authenticated user info"""
    return current_user
