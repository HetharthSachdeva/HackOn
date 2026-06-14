"""FastAPI application factory.

This is the ASGI entrypoint. Run with:

    uvicorn app.main:app --reload

The app is constructed by :func:`create_app` so tests can build isolated
instances with custom settings.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.v1 import api_router
from app.core.config import get_settings
from app.core.database import dispose_engine, get_engine
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging
from app.core.middleware import RequestContextMiddleware
from app.core.rate_limit import RateLimitMiddleware
from app.core.redis import close_redis, is_configured as redis_configured

log = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Startup / shutdown hooks.

    On startup we eagerly build the DB engine so the first real request
    doesn't pay the connect-time cost. On shutdown we dispose of it
    cleanly so connections are released back to the Supabase pooler and
    the Redis client (if configured) is closed.
    """
    settings = get_settings()
    log.info(
        "app.startup",
        env=settings.app_env,
        debug=settings.app_debug,
        version=__version__,
        redis_enabled=redis_configured(),
        rate_limit_enabled=settings.rate_limit_enabled,
    )
    if settings.dev_bypass_auth:
        # Very loud, intentionally repeated banner so this can't slip past code review,
        # log scraping, or a bleary-eyed glance at startup output.
        log.warning(
            "auth.dev_bypass_enabled_at_startup",
            user_id=settings.dev_user_id,
            user_email=settings.dev_user_email,
            override_header="X-Dev-User-Id",
            danger=(
                "AUTH IS DISABLED — every request authenticates as the dev user. "
                "This MUST be off in any non-dev environment."
            ),
        )
    get_engine()  # trigger lazy construction
    try:
        yield
    finally:
        await dispose_engine()
        await close_redis()
        log.info("app.shutdown")


def create_app() -> FastAPI:
    """Build and return a fully wired FastAPI application."""
    configure_logging()
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=__version__,
        description=(
            "AI-first quick-commerce backend. Built on FastAPI, async "
            "SQLAlchemy, Supabase Auth, and pgvector semantic search."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # --- Middleware (outermost added last) -----------------------------
    app.add_middleware(RequestContextMiddleware)
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
    )

    # --- Error handling -------------------------------------------------
    register_exception_handlers(app)

    # --- Routes ---------------------------------------------------------
    # Mount versioned API.
    app.include_router(api_router, prefix=settings.api_v1_prefix)

    # Also expose the bare /health endpoints at the root for orchestrators
    # that don't want to know about /api/v1.
    from app.api.v1 import health as health_module

    app.include_router(health_module.router)

    from fastapi.responses import FileResponse
    from fastapi.staticfiles import StaticFiles
    import os

    # Look for the compiled frontend directory to serve it in production
    backend_root = os.path.dirname(os.path.dirname(__file__))
    frontend_dist = os.path.join(backend_root, "frontend_dist")
    
    if os.path.isdir(frontend_dist):
        log.info("app.frontend_serving", path=frontend_dist)
        
        # Mount the assets directory (contains JS/CSS/Images built by Vite)
        assets_dir = os.path.join(frontend_dist, "assets")
        if os.path.isdir(assets_dir):
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
        
        # Catch-all route to serve the React SPA and other static files
        @app.get("/{full_path:path}", include_in_schema=False)
        async def serve_frontend(full_path: str):
            path = os.path.join(frontend_dist, full_path)
            if os.path.isfile(path):
                return FileResponse(path)
            # Fallback to index.html for client-side routing
            return FileResponse(os.path.join(frontend_dist, "index.html"))
    else:
        # Fallback root for API-only mode
        @app.get("/", include_in_schema=False)
        async def root() -> dict[str, str]:
            return {
                "name": settings.app_name,
                "version": __version__,
                "docs": "/docs",
                "openapi": "/openapi.json",
            }

    return app


app = create_app()
