"""Notifications router using Supabase Realtime"""

from fastapi import APIRouter, HTTPException, Depends
from app.middleware.auth import get_current_user
from app.database import get_supabase
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/")
async def list_notifications(
    page: int = 1,
    limit: int = 20,
    unread_only: bool = False,
    current_user=Depends(get_current_user)
):
    """List notifications for current user"""
    supabase = get_supabase()
    try:
        query = supabase.table("notifications") \
            .select("*") \
            .eq("user_id", str(current_user.id)) \
            .order("created_at", desc=True)

        if unread_only:
            query = query.eq("read", False)

        offset = (page - 1) * limit
        result = query.range(offset, offset + limit - 1).execute()
        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch notifications")


@router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user=Depends(get_current_user)):
    """Mark a notification as read"""
    supabase = get_supabase()
    supabase.table("notifications").update({"read": True}).eq("id", notification_id).execute()
    return {"message": "Notification marked as read"}


@router.put("/read-all")
async def mark_all_read(current_user=Depends(get_current_user)):
    """Mark all notifications as read"""
    supabase = get_supabase()
    supabase.table("notifications").update({"read": True}).eq("user_id", str(current_user.id)).execute()
    return {"message": "All notifications marked as read"}


@router.get("/unread-count")
async def get_unread_count(current_user=Depends(get_current_user)):
    """Get count of unread notifications"""
    supabase = get_supabase()
    result = supabase.table("notifications") \
        .select("id", count="exact") \
        .eq("user_id", str(current_user.id)) \
        .eq("read", False) \
        .execute()
    return {"unread_count": result.count or 0}
