"""Structured logging setup using structlog.

Call :func:`configure_logging` once at application startup. Get loggers via
``log = structlog.get_logger(__name__)`` from anywhere in the codebase.

In dev we emit colorized console output. In prod we emit JSON, one event per
line, which slots cleanly into log aggregation pipelines.
"""

from __future__ import annotations

import logging
import sys

import structlog

from app.core.config import get_settings


def configure_logging() -> None:
    """Configure structlog + stdlib logging for the whole app."""
    settings = get_settings()
    level = getattr(logging, settings.log_level)

    # Route stdlib logs (uvicorn, sqlalchemy, etc.) through structlog formatting.
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=level,
    )

    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if settings.is_dev:
        renderer: structlog.types.Processor = structlog.dev.ConsoleRenderer(colors=True)
    else:
        renderer = structlog.processors.JSONRenderer()

    structlog.configure(
        processors=[*shared_processors, renderer],
        wrapper_class=structlog.make_filtering_bound_logger(level),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Quiet a few noisy loggers in dev.
    for noisy in ("sqlalchemy.engine.Engine", "httpx", "httpcore"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
