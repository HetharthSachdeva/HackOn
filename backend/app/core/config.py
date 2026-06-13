"""Application configuration loaded from environment / .env.

All settings are exposed via :func:`get_settings`, which is cached for the
lifetime of the process. Import the cached accessor instead of instantiating
:class:`Settings` directly so that tests can override values via fixtures.

Environment variables are validated by Pydantic v2. Missing or malformed
values raise at startup, which is intentional — we want failures to be loud.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    """Typed application settings.

    Reads from environment variables and, if present, the ``.env`` file at the
    project root. Field names are case-insensitive in the environment.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Application -----------------------------------------------------
    app_name: str = "Quick-Commerce API"
    app_env: Literal["dev", "staging", "prod"] = "dev"
    app_debug: bool = False
    api_v1_prefix: str = "/api/v1"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"

    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://localhost:5173"],
        description="Allowed CORS origins. Use ['*'] to allow any origin (dev only).",
    )

    # --- Supabase --------------------------------------------------------
    supabase_url: str = Field(..., description="https://<project-ref>.supabase.co")
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_jwt_secret: str = Field(
        "",
        description=(
            "Optional HMAC secret for legacy HS256 token verification. "
            "Modern Supabase projects use asymmetric keys via JWKS and do "
            "NOT need this set. Tests use it to mint deterministic tokens."
        ),
    )

    # --- Database --------------------------------------------------------
    database_url: str = Field(
        ...,
        description=(
            "Async SQLAlchemy URL pointing at Supabase Postgres. "
            "Use the pooled connection on port 6543."
        ),
    )
    db_echo: bool = False
    db_pool_size: int = 5
    db_max_overflow: int = 10

    # --- AI / LLM (Phase 3) ---------------------------------------------
    llm_provider: Literal["stub", "openai", "azure", "anthropic", "gemini"] = "stub"
    llm_api_key: str = ""
    llm_model: str = ""
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    # --- Optional infra --------------------------------------------------
    # Redis is used for WebSocket pub/sub fan-out across workers, rate
    # limiting, and short-lived caching. Required for realtime features;
    # the rest of the API degrades gracefully without it.
    redis_url: str = ""
    redis_namespace: str = "qc"

    # --- Admin / ops -----------------------------------------------------
    admin_token: str = Field(
        "",
        description=(
            "Static shared secret for the /admin/* endpoints. "
            "Pass via `X-Admin-Token` header. Leave empty to disable admin routes."
        ),
    )

    # --- Rate limiting ---------------------------------------------------
    rate_limit_enabled: bool = False
    rate_limit_per_minute: int = 120

    # --- Derived helpers -------------------------------------------------
    @property
    def is_dev(self) -> bool:
        return self.app_env == "dev"

    @property
    def is_prod(self) -> bool:
        return self.app_env == "prod"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_cors(cls, value: object) -> object:
        """Allow ``CORS_ORIGINS`` to be a comma-separated string in .env."""
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return []
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the process-wide :class:`Settings` singleton.

    Cached so we read env vars and parse them exactly once. Tests may clear
    the cache via ``get_settings.cache_clear()``.
    """
    return Settings()  # type: ignore[call-arg]
