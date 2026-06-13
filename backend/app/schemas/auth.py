"""Auth-related response schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class CurrentUserResponse(BaseModel):
    """Public projection of the JWT-authenticated user."""

    id: str = Field(..., description="Supabase user UUID")
    email: str | None = Field(None, description="Email, if present on the JWT")
    role: str = Field("authenticated", description="Supabase role claim")

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "9a0b3a3a-1111-2222-3333-444455556666",
                "email": "shopper@example.com",
                "role": "authenticated",
            }
        }
    }
