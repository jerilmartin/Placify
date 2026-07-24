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
    supabase_anon = get_supabase_anon()
    supabase_admin = get_supabase()  # service_role key — bypasses RLS
    requested_role = user_data.role.value if hasattr(user_data.role, "value") else user_data.role
    if requested_role not in {"student", "recruiter", "university", "mentor"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This role cannot be created through public registration",
        )
    try:
        # Register with Supabase Auth
        auth_response = supabase_anon.auth.sign_up({
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

        user_id = str(auth_response.user.id)
        role = requested_role
        full_name = user_data.full_name
        email = user_data.email

        # Create role-specific profile row using service_role (bypasses RLS)
        try:
            _insert_profile(supabase_admin, user_id, role, full_name, email)
        except Exception as profile_err:
            logger.error(f"Profile row creation failed for {user_id} ({role}): {profile_err}")
            # Don't block registration if profile insert fails

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
    except HTTPException:
        raise
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


@router.post("/repair-profile", status_code=200)
async def repair_profile(
    body: dict,
    current_user=Depends(get_current_user)
):
    """
    Idempotent endpoint to ensure a profile row exists for the current user.
    Called on login as a best-effort repair for accounts missing their profile.
    Uses service_role client — bypasses RLS.
    """
    supabase_admin = get_supabase()
    # Never trust a client-supplied role when using the service-role client.
    role = current_user.role or "student"
    full_name = body.get("full_name", current_user.full_name) or current_user.email or ""
    email = body.get("email", current_user.email) or ""
    user_id = str(current_user.id)

    try:
        _insert_profile(supabase_admin, user_id, role, full_name, email)
        return {"status": "ok", "message": f"Profile ensured for {role}"}
    except Exception as e:
        logger.error(f"repair-profile error for {user_id}: {e}")
        return {"status": "error", "message": str(e)}


def _insert_profile(supabase_admin, user_id: str, role: str, full_name: str, email: str):
    """
    Insert or repair a profile row using the service-role client.
    The explicit existence check also works before the unique user_id migration
    has been applied.
    """
    if role == "student":
        table_name = "student_profiles"
        payload = {
            "user_id": user_id,
            "full_name": full_name,
            "email": email,
            "profile_completion": 0,
        }
    elif role == "university":
        table_name = "university_profiles"
        payload = {
            "user_id": user_id,
            "name": full_name or "University",
            "contact_email": email,
        }
    elif role == "recruiter":
        table_name = "recruiter_profiles"
        payload = {
            "user_id": user_id,
            "company_name": full_name or "Company",
            "contact_email": email,
        }
    elif role == "mentor":
        table_name = "mentor_profiles"
        payload = {
            "user_id": user_id,
            "full_name": full_name or "Mentor",
        }
    else:
        raise ValueError(f"Unsupported self-service role: {role}")

    existing = supabase_admin.table(table_name) \
        .select("id").eq("user_id", user_id).limit(1).execute()
    if existing.data:
        # This endpoint repairs missing rows only. Never overwrite an existing
        # university name, recruiter company, student completion score, or
        # other domain data with the Auth user's generic metadata on login.
        return

    supabase_admin.table(table_name).insert(payload).execute()
