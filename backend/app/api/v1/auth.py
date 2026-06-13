"""Auth-related endpoints.

Authentication itself is handled by Supabase Auth on the client. This module
exposes only the server-side surface area we need:

* ``GET /auth/me`` — echo back the authenticated user (verifies the JWT).

Sign-up / sign-in / OTP / password reset all happen via the Supabase client
SDK directly; the backend simply trusts the resulting JWT.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.core.deps import CurrentUserDep
from app.schemas.auth import CurrentUserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get(
    "/me",
    response_model=CurrentUserResponse,
    summary="Current authenticated user",
    description=(
        "Returns the user identified by the bearer token in the "
        "`Authorization` header. The token must be a valid Supabase Auth "
        "access token signed by this project."
    ),
    responses={
        401: {"description": "Missing, invalid, or expired token"},
    },
)
async def me(user: CurrentUserDep) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
    )
