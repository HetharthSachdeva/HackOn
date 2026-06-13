"""Liveness and readiness endpoints used by orchestrators and humans.

* ``GET /health`` — fast, no I/O. Confirms the process is up.
* ``GET /health/ready`` — includes a real DB round-trip. Use this for
  load-balancer readiness checks.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, status

from app import __version__
from app.core import database

router = APIRouter(tags=["health"])


@router.get(
    "/health",
    summary="Liveness probe",
    description="Returns 200 as long as the process is running. No I/O.",
    status_code=status.HTTP_200_OK,
)
async def health() -> dict[str, Any]:
    return {"status": "ok", "version": __version__}


@router.get(
    "/health/ready",
    summary="Readiness probe",
    description="Includes a DB round-trip so we don't take traffic before the DB is reachable.",
)
async def ready() -> dict[str, Any]:
    db_status = await database.ping()
    return {
        "status": "ok" if db_status["ok"] else "degraded",
        "version": __version__,
        "checks": {"database": db_status},
    }
