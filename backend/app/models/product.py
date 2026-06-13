"""ORM mapping for the externally-managed ``qcommerce_products`` table.

This table is created and populated by an upstream pipeline. We map it
read-only:

* Alembic's ``env.py`` excludes it from autogeneration.
* We never INSERT/UPDATE/DELETE rows here from the API.
* ``__table_args__`` sets ``extend_existing=True`` so a stale class cache
  doesn't clash with reflection.

The ``embedding`` column uses :class:`pgvector.sqlalchemy.Vector` so we can
issue cosine-distance queries (``Product.embedding.cosine_distance(...)``)
without raw SQL.
"""

from __future__ import annotations

from decimal import Decimal

from pgvector.sqlalchemy import Vector
from sqlalchemy import Boolean, Float, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

# Must match the model used to populate the `embedding` column upstream.
EMBEDDING_DIM = 384


class Product(Base):
    """Read-only projection of ``qcommerce_products``."""

    __tablename__ = "qcommerce_products"
    __table_args__ = {"extend_existing": True}

    asin: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False, index=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    img_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    stars: Mapped[float | None] = mapped_column(Float, nullable=True)
    reviews: Mapped[int | None] = mapped_column(Integer, nullable=True)
    unit_size: Mapped[str | None] = mapped_column(String, nullable=True)
    stock_qty: Mapped[int | None] = mapped_column(Integer, nullable=True)
    in_stock: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    delivery_time_mins: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tags: Mapped[str | None] = mapped_column(Text, nullable=True)
    embedding: Mapped[list[float] | None] = mapped_column(
        Vector(EMBEDDING_DIM),
        nullable=True,
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging convenience
        return f"<Product asin={self.asin!r} title={self.title!r}>"
