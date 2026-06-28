"""
Supabase database client
"""

from supabase import create_client, Client
from app.config import settings
import logging

logger = logging.getLogger(__name__)

_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Get or create Supabase client (singleton)"""
    global _supabase_client
    if _supabase_client is None:
        if not settings.supabase_url or not settings.supabase_service_role_key:
            logger.warning("Supabase credentials not configured. Using anon key fallback.")
            key = settings.supabase_anon_key or "placeholder"
            url = settings.supabase_url or "https://placeholder.supabase.co"
        else:
            url = settings.supabase_url
            key = settings.supabase_service_role_key

        _supabase_client = create_client(url, key)
        logger.info(f"✅ Supabase client initialized: {url}")
    return _supabase_client


def get_supabase_anon() -> Client:
    """Get Supabase client with anon key (for auth operations)"""
    url = settings.supabase_url or "https://placeholder.supabase.co"
    key = settings.supabase_anon_key or "placeholder"
    return create_client(url, key)
