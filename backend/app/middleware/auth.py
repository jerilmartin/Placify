"""
Authentication middleware
JWT verification using Supabase Auth tokens
"""

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import get_supabase_anon
from app.config import settings
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)


class CurrentUser:
    def __init__(self, id, email, role, full_name=""):
        self.id = id
        self.email = email
        self.role = role
        self.full_name = full_name


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> CurrentUser:
    """Verify Supabase JWT token and return current user"""
    if not credentials:
        if settings.ENVIRONMENT == "development":
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
            if settings.ENVIRONMENT == "development":
                return CurrentUser(
                    id="00000000-0000-0000-0000-000000000001",
                    email="aarav.s@iitb.ac.in",
                    role="student",
                    full_name="Aarav Sharma",
                )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )

        user = user_response.user
        user_meta = user.user_metadata or {}

        return CurrentUser(
            id=user.id,
            email=user.email,
            role=user_meta.get("role", "student"),
            full_name=user_meta.get("full_name", ""),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth error: {e}")
        if settings.ENVIRONMENT == "development":
            return CurrentUser(
                id="00000000-0000-0000-0000-000000000001",
                email="aarav.s@iitb.ac.in",
                role="student",
                full_name="Aarav Sharma",
            )
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
