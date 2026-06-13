"""ai + missions + reorders

Revision ID: 0002_ai_and_missions
Revises: 0001_initial_commerce
Create Date: 2026-06-13 00:00:01

Adds tables for mission bundles and smart reorder subscriptions. Does NOT
modify `qcommerce_products` — embeddings are assumed to already exist there.
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002_ai_and_missions"
down_revision: Union[str, None] = "0001_initial_commerce"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ----- missions -----------------------------------------------------
    op.create_table(
        "missions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(80), nullable=False, unique=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("image_url", sa.Text),
        sa.Column("hero_color", sa.String(20)),
        sa.Column("query", sa.Text, nullable=False),
        sa.Column("max_items", sa.Integer, nullable=False, server_default="6"),
        sa.Column(
            "category_filter",
            sa.Text,
            comment="Comma-separated list of allowed categories (substring match).",
        ),
        sa.Column("max_unit_price", sa.Numeric(10, 2)),
        sa.Column("is_active", sa.Integer, nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_missions_slug", "missions", ["slug"])

    # ----- reorder_subscriptions ---------------------------------------
    op.create_table(
        "reorder_subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("asin", sa.String, nullable=False),
        sa.Column("quantity", sa.Integer, nullable=False, server_default="1"),
        sa.Column("cadence_days", sa.Integer, nullable=False),
        sa.Column("next_run_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_reorder_subscriptions_user_id", "reorder_subscriptions", ["user_id"])
    op.create_index("ix_reorder_subscriptions_asin", "reorder_subscriptions", ["asin"])
    op.create_index("ix_reorder_subscriptions_next_run_at", "reorder_subscriptions", ["next_run_at"])
    op.create_index("ix_reorder_subscriptions_status", "reorder_subscriptions", ["status"])


def downgrade() -> None:
    op.drop_table("reorder_subscriptions")
    op.drop_table("missions")
