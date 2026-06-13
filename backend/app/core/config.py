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

from pydantic import Field, field_validator, model_validator
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
    llm_provider: Literal["stub", "openai", "azure", "anthropic", "gemini", "gemma"] = "stub"
    llm_api_key: str = ""
    llm_model: str = ""
    llm_base_url: str = Field(
        "",
        description=(
            "Optional override for the LLM HTTP base URL. Used to point Gemma "
            "at a self-hosted Ollama (e.g. http://localhost:11434/v1) or any "
            "OpenAI-compatible proxy. Leave empty to use the provider default."
        ),
    )
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

    # --- Dev-only auth bypass --------------------------------------------
    # When ``DEV_BYPASS_AUTH=true`` the server skips Supabase JWT validation
    # and authenticates every request as ``DEV_USER_ID`` (or whatever the
    # ``X-Dev-User-Id`` header says, per-request). This is a flat-out lie and
    # must NEVER be enabled outside local development — the cross-field
    # validator below refuses to construct Settings if the flag is true while
    # APP_ENV is anything other than "dev".
    dev_bypass_auth: bool = Field(
        False,
        description=(
            "DEV ONLY. Skip JWT verification and authenticate every request "
            "as DEV_USER_ID. Refuses to load unless APP_ENV='dev'. Never "
            "enable in staging or prod."
        ),
    )
    dev_user_id: str = Field(
        "00000000-0000-0000-0000-000000000001",
        description="Fixed user UUID returned when DEV_BYPASS_AUTH=true.",
    )
    dev_user_email: str = Field(
        "dev@local.test",
        description="Email returned for the synthetic dev user.",
    )

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

    @model_validator(mode="after")
    def _guard_dev_bypass(self) -> "Settings":
        """Refuse to construct Settings if dev bypass is on outside APP_ENV=dev.

        This is a hard fail-closed safeguard: a misconfigured staging/prod
        deploy will crash at startup rather than silently expose every route.
        """
        if self.dev_bypass_auth and self.app_env != "dev":
            raise ValueError(
                f"DEV_BYPASS_AUTH=true is only permitted when APP_ENV='dev' "
                f"(got APP_ENV={self.app_env!r}). Refusing to start: this "
                f"would disable authentication for every request."
            )
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the process-wide :class:`Settings` singleton.

    Cached so we read env vars and parse them exactly once. Tests may clear
    the cache via ``get_settings.cache_clear()``.
    """
    return Settings()  # type: ignore[call-arg]
