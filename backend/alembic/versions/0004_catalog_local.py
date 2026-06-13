"""local catalog table (qcommerce_products) + pgvector index

Revision ID: 0004_catalog_local
Revises: 0003_reviews_notifications
Create Date: 2026-06-13 12:00:00

Creates a local copy of the catalog table identical in shape to the upstream
Supabase ``qcommerce_products`` table. We host it locally now so the API can
do transactional commerce against a single Postgres instance (no cross-DB
joins), and we keep the catalog fresh via a one-shot sync command:

    python -m app.cli sync-catalog

The pgvector ``vector`` extension is created here; it must be installed on
the Postgres server (pgvector 0.5+).

We also pre-create an HNSW cosine index on ``embedding`` — at 6k rows it's
overkill, but it's a single statement and protects us if the catalog grows.
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector

revision: str = "0004_catalog_local"
down_revision: Union[str, None] = "0003_reviews_notifications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


EMBEDDING_DIM = 384


def upgrade() -> None:
    # pgvector must be available before any `vector(N)` column is created.
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if "qcommerce_products" not in tables:
        op.create_table(
            "qcommerce_products",
            sa.Column("asin", sa.String, primary_key=True),
            sa.Column("title", sa.Text, nullable=False),
            sa.Column("category", sa.String, nullable=False),
            sa.Column("price", sa.Numeric(10, 2), nullable=False),
            sa.Column("img_url", sa.Text),
            sa.Column("stars", sa.Float),
            sa.Column("reviews", sa.Integer),
            sa.Column("unit_size", sa.String),
            sa.Column("stock_qty", sa.Integer),
            sa.Column("in_stock", sa.Boolean),
            sa.Column("delivery_time_mins", sa.Integer),
            sa.Column("tags", sa.Text),
            sa.Column("embedding", Vector(EMBEDDING_DIM)),
        )

        op.create_index(
            "ix_qcommerce_products_category", "qcommerce_products", ["category"]
        )
        op.create_index(
            "ix_qcommerce_products_in_stock", "qcommerce_products", ["in_stock"]
        )

    # HNSW cosine index. Skipped automatically by pgvector if `embedding` is
    # NULL on a row.
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_qcommerce_products_embedding_hnsw "
        "ON qcommerce_products USING hnsw (embedding vector_cosine_ops) "
        "WITH (m = 16, ef_construction = 64)"
    )


def downgrade() -> None:
    op.drop_index("ix_qcommerce_products_embedding_hnsw", table_name="qcommerce_products")
    op.drop_index("ix_qcommerce_products_in_stock", table_name="qcommerce_products")
    op.drop_index("ix_qcommerce_products_category", table_name="qcommerce_products")
    op.drop_table("qcommerce_products")
    # Intentionally keep the `vector` extension installed.
