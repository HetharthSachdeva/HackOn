"""Async SQLAlchemy engine, session factory, and declarative base.

We expose a single async engine and a session factory, both lazily built so
imports don't trigger network I/O. ``Base`` is the declarative base used by
all ORM models in :mod:`app.models`.

Dependencies should resolve sessions via :func:`app.core.deps.get_db_session`
rather than touching ``async_session_factory`` directly.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings


class Base(DeclarativeBase):
    """Declarative base for all ORM models.

    Subclassing this hooks models into Alembic's autogenerate target. Tables
    that already exist in Supabase and are managed elsewhere (e.g.
    ``qcommerce_products``) should set ``__table_args__ = {"extend_existing": True}``
    and be excluded from autogeneration in :file:`alembic/env.py`.
    """


_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    """Return the process-wide async SQLAlchemy engine, creating it on first use."""
    global _engine
    if _engine is None:
        settings = get_settings()
        _engine = create_async_engine(
            settings.database_url,
            echo=settings.db_echo,
            pool_size=settings.db_pool_size,
            max_overflow=settings.db_max_overflow,
            pool_pre_ping=True,
            future=True,
        )
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Return the cached session factory, creating it on first use."""
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            bind=get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )
    return _session_factory


@asynccontextmanager
async def session_scope() -> AsyncIterator[AsyncSession]:
    """Context-managed session for use outside FastAPI request scope.

    Useful in scripts, background jobs, and tests. Commits on success, rolls
    back on exception, and always closes the session.
    """
    session = get_session_factory()()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


async def dispose_engine() -> None:
    """Dispose of the engine. Call on application shutdown."""
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _session_factory = None


async def ping() -> dict[str, Any]:
    """Lightweight DB health check used by the /health endpoint."""
    from sqlalchemy import text

    async with session_scope() as session:
        result = await session.execute(text("select 1 as ok"))
        row = result.first()
        return {"ok": bool(row and row.ok == 1)}
