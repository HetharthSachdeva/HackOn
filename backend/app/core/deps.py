"""Reusable FastAPI dependencies.

These are the small glue functions every router relies on:

* :func:`get_db` — yields an async SQLAlchemy session per request.
* :func:`get_current_user` — verifies the Supabase bearer token and returns
  a :class:`~app.core.security.CurrentUser`.
* :func:`get_optional_user` — like :func:`get_current_user` but returns
  ``None`` if no token was supplied (rather than raising).
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session_factory
from app.core.errors import UnauthorizedError
from app.core.security import CurrentUser, decode_supabase_jwt

# `auto_error=False` lets us produce our own structured 401 via UnauthorizedError
# instead of FastAPI's default {"detail": "..."} body.
_bearer_scheme = HTTPBearer(auto_error=False)


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


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
) -> CurrentUser:
    """Require a valid Supabase JWT and return the authenticated user."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise UnauthorizedError("Missing or invalid Authorization header")
    return decode_supabase_jwt(credentials.credentials)


def get_optional_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
) -> CurrentUser | None:
    """Return the authenticated user if a token is present, otherwise None."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        return None
    try:
        return decode_supabase_jwt(credentials.credentials)
    except UnauthorizedError:
        return None


# Convenience aliases for cleaner router signatures:
#   def handler(db: DBSession, user: CurrentUserDep): ...
DBSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]
OptionalUserDep = Annotated[CurrentUser | None, Depends(get_optional_user)]
