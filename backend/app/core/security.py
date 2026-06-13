"""Supabase JWT verification.

Modern Supabase projects sign user access tokens with **asymmetric** keys
(ES256 or RS256). The project publishes its public keys at
``<SUPABASE_URL>/auth/v1/.well-known/jwks.json`` and rotates them
transparently — verifiers don't need any shared secret.

This module verifies incoming bearer tokens using that JWKS endpoint with
PyJWT's :class:`PyJWKClient` (keys are cached in-process to keep the hot
path off the network). If a project is still on the legacy HMAC scheme,
setting ``SUPABASE_JWT_SECRET`` enables HS256 verification as a fallback
(also used by the test suite to mint deterministic tokens).

Why we verify locally (instead of calling Supabase on every request):
    * It's ~3 orders of magnitude faster.
    * It works offline.
    * It avoids accidentally rate-limiting ourselves on Supabase Auth.
"""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Any

import jwt
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError, PyJWKClientError

from app.core.config import get_settings
from app.core.errors import UnauthorizedError

# Supabase always issues access tokens with this audience.
_SUPABASE_AUDIENCE = "authenticated"
# Asymmetric algorithms accepted from the JWKS-signed tokens.
_ASYMMETRIC_ALGS = ["ES256", "RS256"]
# JWKS keys are refreshed at most every _JWKS_LIFESPAN seconds, so rotations
# propagate within that window without us doing anything.
_JWKS_LIFESPAN = 600


@dataclass(slots=True, frozen=True)
class CurrentUser:
    """Authenticated user extracted from a verified Supabase JWT.

    Attributes:
        id: Supabase user UUID (the ``sub`` claim).
        email: Email address, if present in the token.
        role: Supabase role, typically ``"authenticated"``.
        raw_claims: Full decoded JWT payload, for advanced use cases.
    """

    id: str
    email: str | None
    role: str
    raw_claims: dict[str, Any]


def _jwks_url(supabase_url: str) -> str:
    """Build the JWKS URL from a Supabase project URL."""
    return f"{supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"


@lru_cache(maxsize=1)
def _get_jwk_client() -> PyJWKClient:
    """Return a process-wide :class:`PyJWKClient` with caching enabled."""
    settings = get_settings()
    return PyJWKClient(
        _jwks_url(settings.supabase_url),
        cache_keys=True,
        lifespan=_JWKS_LIFESPAN,
    )


def _verify_with_jwks(token: str) -> dict[str, Any]:
    """Verify ``token`` against the Supabase JWKS endpoint."""
    client = _get_jwk_client()
    try:
        signing_key = client.get_signing_key_from_jwt(token)
    except PyJWKClientError as exc:
        raise UnauthorizedError(f"Unable to resolve signing key: {exc}") from exc
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=_ASYMMETRIC_ALGS,
        audience=_SUPABASE_AUDIENCE,
        options={"require": ["exp", "sub"]},
    )


def _verify_with_hs256(token: str, secret: str) -> dict[str, Any]:
    """Verify ``token`` with a shared HMAC secret (legacy or test path)."""
    return jwt.decode(
        token,
        secret,
        algorithms=["HS256"],
        audience=_SUPABASE_AUDIENCE,
        options={"require": ["exp", "sub"]},
    )


def decode_supabase_jwt(token: str) -> CurrentUser:
    """Verify and decode a Supabase access token.

    The token's header advertises its algorithm. ``HS256`` tokens are verified
    with the configured shared secret (legacy projects + tests); asymmetric
    tokens are verified against the project's JWKS endpoint.

    Raises:
        UnauthorizedError: If the token is missing, malformed, expired,
            uses an unexpected algorithm, or fails signature verification.
    """
    if not token:
        raise UnauthorizedError("Missing bearer token")

    settings = get_settings()
    try:
        header = jwt.get_unverified_header(token)
    except InvalidTokenError as exc:
        raise UnauthorizedError(f"Invalid token: {exc}") from exc

    alg = header.get("alg")
    try:
        if alg == "HS256":
            if not settings.supabase_jwt_secret:
                raise UnauthorizedError(
                    "Received HS256 token but SUPABASE_JWT_SECRET is not configured"
                )
            payload = _verify_with_hs256(token, settings.supabase_jwt_secret)
        elif alg in _ASYMMETRIC_ALGS:
            payload = _verify_with_jwks(token)
        else:
            raise UnauthorizedError(f"Unsupported token algorithm: {alg!r}")
    except InvalidTokenError as exc:
        raise UnauthorizedError(f"Invalid token: {exc}") from exc

    sub = payload.get("sub")
    if not sub:
        raise UnauthorizedError("Token missing 'sub' claim")

    return CurrentUser(
        id=str(sub),
        email=payload.get("email"),
        role=payload.get("role", "authenticated"),
        raw_claims=payload,
    )
