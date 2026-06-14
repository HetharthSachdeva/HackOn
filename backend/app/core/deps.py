"""Reusable FastAPI dependencies.

These are the small glue functions every router relies on:

* :func:`get_db` — yields an async SQLAlchemy session per request.
* :func:`get_current_user` — verifies the Supabase bearer token and returns
  a :class:`~app.core.security.CurrentUser`.
* :func:`get_optional_user` — like :func:`get_current_user` but returns
  ``None`` if no token was supplied (rather than raising).

When ``DEV_BYPASS_AUTH=true`` (only legal with ``APP_ENV=dev``) both
dependencies short-circuit and return a synthetic dev user — see
:mod:`app.core.config` for the fail-closed cross-field validator.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Annotated

import structlog
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.database import get_session_factory
from app.core.errors import UnauthorizedError
from app.core.security import CurrentUser, decode_supabase_jwt

log = structlog.get_logger(__name__)

# `auto_error=False` lets us produce our own structured 401 via UnauthorizedError
# instead of FastAPI's default {"detail": "..."} body.
_bearer_scheme = HTTPBearer(auto_error=False)

_DEV_BYPASS_HEADER = "X-Dev-User-Id"
_dev_bypass_warned: bool = False


async def get_db() -> AsyncIterator[AsyncSession]:
    """Yield an async DB session for the duration of the request.

    Commits on clean exit, rolls back on exception, and always closes.
    """
    factory = get_session_factory()
    session = factory()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


def _maybe_warn_dev_bypass(user_id: str) -> None:
    """Emit a single, very loud warning the first time the bypass fires."""
    global _dev_bypass_warned
    if _dev_bypass_warned:
        return
    log.warning(
        "auth.dev_bypass_active",
        user_id=user_id,
        notice=(
            "DEV_BYPASS_AUTH is enabled — every request is authenticated as "
            "the dev user with no JWT verification. NEVER deploy with this on."
        ),
    )
    _dev_bypass_warned = True


def _dev_bypass_user(settings: Settings, request: Request) -> CurrentUser:
    """Build the synthetic CurrentUser returned while bypass is active.

    A per-request ``X-Dev-User-Id`` header overrides the configured default
    so you can test "as" different users from Swagger without restarting.
    """
    override = request.headers.get(_DEV_BYPASS_HEADER)
    user_id = (override or settings.dev_user_id).strip()
    if not user_id:
        user_id = settings.dev_user_id
    _maybe_warn_dev_bypass(user_id)
    return CurrentUser(
        id=user_id,
        email=settings.dev_user_email or "dev@local.test",
        role="authenticated",
        raw_claims={
            "sub": user_id,
            "email": settings.dev_user_email or "dev@local.test",
            "role": "authenticated",
            "dev_bypass": True,
        },
    )


def get_current_user(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
) -> CurrentUser:
    """Require a valid Supabase JWT and return the authenticated user.

    When :data:`Settings.dev_bypass_auth` is true this short-circuits the
    JWT check and returns a synthetic dev user instead.
    """
    settings = get_settings()
    if settings.dev_bypass_auth:
        return _dev_bypass_user(settings, request)

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise UnauthorizedError("Missing or invalid Authorization header")
    return decode_supabase_jwt(credentials.credentials)


def get_optional_user(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
) -> CurrentUser | None:
    """Return the authenticated user if a token is present, otherwise None.

    When :data:`Settings.dev_bypass_auth` is true this always returns the
    synthetic dev user — there's no anonymous mode while bypass is on.
    """
    settings = get_settings()
    if settings.dev_bypass_auth:
        return _dev_bypass_user(settings, request)

    if credentials is None or credentials.scheme.lower() != "bearer":
        return None
    try:
        return decode_supabase_jwt(credentials.credentials)
    except Exception:  # noqa: BLE001 — catch all to degrade to guest gracefully on any auth/network error
        return None


# Convenience aliases for cleaner router signatures:
#   def handler(db: DBSession, user: CurrentUserDep): ...
DBSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]
OptionalUserDep = Annotated[CurrentUser | None, Depends(get_optional_user)]
