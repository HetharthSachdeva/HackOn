"""Curated mission bundles.

A Mission is a job-to-be-done (e.g., "Hangover Kit", "Dinner for 4"). Items
are resolved dynamically at request time via semantic search using
``Mission.query`` against the product catalog. Optional filters constrain
which categories / price ranges qualify.

For demos that want stable item lists, a future enhancement can add a
``MissionItem`` join table with explicit ASINs that overrides the query.
"""

from __future__ import annotations

import uuid

from sqlalchemy import Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin


class Mission(Base, TimestampMixin):
    """A curated bundle whose items are resolved by semantic search."""

    __tablename__ = "missions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    slug: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    hero_color: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Semantic query used to find items at request time.
    query: Mapped[str] = mapped_column(Text, nullable=False)

    # Optional constraints.
    max_items: Mapped[int] = mapped_column(Integer, nullable=False, default=6)
    category_filter: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Comma-separated list of allowed categories (substring match).",
    )
    max_unit_price: Mapped[Numeric | None] = mapped_column(Numeric(10, 2), nullable=True)

    is_active: Mapped[bool] = mapped_column(
        Integer, nullable=False, default=1, server_default="1"
    )
