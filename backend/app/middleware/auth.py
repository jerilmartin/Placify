"""
Authentication middleware
JWT verification using Supabase Auth tokens
"""

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import get_supabase, get_supabase_anon
from app.config import settings
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)


class CurrentUser:
    def __init__(self, id, email, role, full_name="", created_at=None):
        self.id = id
        self.email = email
        self.role = role
        self.full_name = full_name
        self.created_at = created_at or datetime.now(timezone.utc)


def resolve_user_role(user) -> str:
    """Resolve authorization role from server-controlled metadata or DB state."""
    app_role = (getattr(user, "app_metadata", None) or {}).get("role")
    allowed_roles = {
        "student", "recruiter", "university", "mentor", "admin",
        "placement_officer",
    }
    if app_role in allowed_roles:
        return app_role

    # Backward compatibility for accounts created before app_metadata roles:
    # verify the role against a service-side profile row. Never authorize from
    # user_metadata, which account owners can edit themselves.
    supabase = get_supabase()
    user_id = str(user.id)
    profile_roles = (
        ("university_profiles", "university"),
        ("recruiter_profiles", "recruiter"),
        ("mentor_profiles", "mentor"),
        ("student_profiles", "student"),
    )
    for table, role in profile_roles:
        result = supabase.table(table).select("id").eq("user_id", user_id).limit(1).execute()
        if result.data:
            return role
    return "student"


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> CurrentUser:
    """Verify Supabase JWT token and return current user"""
    if not credentials:
        if settings.environment == "development" and settings.enable_demo_auth:
            return CurrentUser(
                id="00000000-0000-0000-0000-000000000001",
                email="aarav.s@iitb.ac.in",
                role="student",
                full_name="Aarav Sharma",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    supabase = get_supabase_anon()

    try:
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )

        user = user_response.user
        user_meta = user.user_metadata or {}

        return CurrentUser(
            id=user.id,
            email=user.email,
            role=resolve_user_role(user),
            full_name=user_meta.get("full_name", ""),
            created_at=user.created_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )


def require_role(*roles: str):
    """Role-based access control dependency"""
    async def role_checker(current_user: CurrentUser = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(roles)}"
            )
        return current_user
    return role_checker


# Convenience role dependencies
require_student = require_role("student")
require_recruiter = require_role("recruiter")
require_university = require_role("university", "placement_officer")
require_mentor = require_role("mentor")
require_admin = require_role("admin")
