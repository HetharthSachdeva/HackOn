"""Shopping cart: one ``Cart`` per user, many ``CartItem`` rows.

We keep prices live (computed from :class:`Product` at read time) rather than
snapshotting them on the cart, so users always see current pricing. Prices
are snapshotted only at order placement (:mod:`app.models.order`).
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Cart(Base, TimestampMixin):
    """A user's persistent cart. PK == user_id (one cart per user)."""

    __tablename__ = "carts"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
    )
    promo_code: Mapped[str | None] = mapped_column(String(50), nullable=True)

    items: Mapped[list["CartItem"]] = relationship(
        back_populates="cart",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class CartItem(Base):
    """A line item in a cart. References ``qcommerce_products.asin``.

    Note we do *not* declare a FK on ``asin`` so the upstream products table
    can be replaced without breaking referential integrity. Validation that
    the ASIN exists is done in the service layer.
    """

    __tablename__ = "cart_items"
    __table_args__ = (
        UniqueConstraint("user_id", "asin", name="uq_cart_items_user_asin"),
        CheckConstraint("quantity > 0", name="ck_cart_items_quantity_positive"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("carts.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    asin: Mapped[str] = mapped_column(String, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    cart: Mapped[Cart] = relationship(back_populates="items")
