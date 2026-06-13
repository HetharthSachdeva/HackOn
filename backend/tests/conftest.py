"""Pytest fixtures shared across the test suite."""

from __future__ import annotations

import os

import pytest

# Provide safe defaults so the test process can import settings even when
# .env is absent. Individual tests can override these.
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-jwt-secret")
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://test:test@localhost:5432/test",
)


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"
