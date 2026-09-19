"""Notifications router using Supabase Realtime"""

from fastapi import APIRouter, HTTPException, Depends
from app.middleware.auth import get_current_user
from app.database import get_supabase
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


def send_notification(
    supabase,
    user_id: str,
    notif_type: str,
    title: str,
    message: str,
    data: dict = None,
):
    """Helper to dispatch in-app notifications cleanly."""
    try:
        supabase.table("notifications").insert({
            "user_id": str(user_id),
            "type": notif_type,
            "title": title,
            "message": message,
            "data": data or {},
            "read": False,
        }).execute()
    except Exception as e:
        logger.warning(f"Failed to create notification for user {user_id}: {e}")


@router.get("", include_in_schema=False)
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
        logger.error(f"Failed to fetch notifications: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch notifications")


@router.put("/{notification_id}/read")
@router.put("/{notification_id}/read/", include_in_schema=False)
async def mark_notification_read(notification_id: str, current_user=Depends(get_current_user)):
    """Mark a notification as read"""
    supabase = get_supabase()
    result = supabase.table("notifications").update({"read": True}) \
        .eq("id", notification_id) \
        .eq("user_id", str(current_user.id)) \
        .execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}


@router.put("/read-all")
@router.put("/read-all/", include_in_schema=False)
async def mark_all_read(current_user=Depends(get_current_user)):
    """Mark all notifications as read"""
    supabase = get_supabase()
    supabase.table("notifications").update({"read": True}).eq("user_id", str(current_user.id)).execute()
    return {"message": "All notifications marked as read"}


@router.get("/unread-count")
@router.get("/unread-count/", include_in_schema=False)
async def get_unread_count(current_user=Depends(get_current_user)):
    """Get count of unread notifications"""
    supabase = get_supabase()
    try:
        result = supabase.table("notifications") \
            .select("id", count="exact") \
            .eq("user_id", str(current_user.id)) \
            .eq("read", False) \
            .execute()
        return {"unread_count": result.count or 0}
    except Exception as e:
        logger.error(f"Failed to fetch unread count: {e}")
        return {"unread_count": 0}

