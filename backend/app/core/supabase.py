"""Thin wrappers around the official ``supabase-py`` client.

Two clients are exposed:

* :func:`get_supabase_anon` — uses the public anon key; subject to RLS.
* :func:`get_supabase_admin` — uses the service-role key; bypasses RLS.

For most server-side work, prefer the admin client. The anon client exists
for the rare case where we want to act on behalf of an unauthenticated user
or test RLS policies.
"""

from __future__ import annotations

from functools import lru_cache

from supabase import Client, create_client

from app.core.config import get_settings


@lru_cache(maxsize=1)
def get_supabase_admin() -> Client:
    """Return a cached Supabase client authenticated with the service-role key."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@lru_cache(maxsize=1)
def get_supabase_anon() -> Client:
    """Return a cached Supabase client authenticated with the public anon key."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_anon_key)
