"""Promo code logic.

Hackathon-grade: a tiny in-memory registry of demo promos. In production this
would move to a ``promos`` table with usage limits, per-user caps, and
date ranges.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True, slots=True)
class Promo:
    code: str
    kind: str        # "flat" | "percent"
    value: Decimal   # flat amount or percent (0–100)
    min_subtotal: Decimal = Decimal("0")
    description: str = ""


_PROMOS: dict[str, Promo] = {
    "FLAT50": Promo(
        code="FLAT50",
        kind="flat",
        value=Decimal("50"),
        min_subtotal=Decimal("199"),
        description="₹50 off on orders above ₹199",
    ),
    "SAVE10": Promo(
        code="SAVE10",
        kind="percent",
        value=Decimal("10"),
        min_subtotal=Decimal("99"),
        description="10% off (max applies on subtotal only)",
    ),
    "NEW100": Promo(
        code="NEW100",
        kind="flat",
        value=Decimal("100"),
        min_subtotal=Decimal("299"),
        description="New-user ₹100 off above ₹299",
    ),
}


def lookup(code: str | None) -> Promo | None:
    if not code:
        return None
    return _PROMOS.get(code.upper())


def compute_discount(promo: Promo | None, subtotal: Decimal) -> Decimal:
    """Return the discount amount (>= 0) for the given subtotal."""
    if promo is None or subtotal < promo.min_subtotal:
        return Decimal("0")
    if promo.kind == "flat":
        return min(promo.value, subtotal)
    if promo.kind == "percent":
        return (subtotal * promo.value / Decimal("100")).quantize(Decimal("0.01"))
    return Decimal("0")
