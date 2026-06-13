"""Tests for reorder service helpers and FSM-like transitions."""

from __future__ import annotations

import pytest

from app.core.errors import ValidationError
from app.services.reorders import compute_next_cadence


def test_compute_next_cadence_basic() -> None:
    assert compute_next_cadence(quantity=2, days_observed=14) == 7
    assert compute_next_cadence(quantity=1, days_observed=30) == 30


def test_compute_next_cadence_floors_to_one() -> None:
    assert compute_next_cadence(quantity=10, days_observed=5) == 1


def test_compute_next_cadence_rejects_non_positive_qty() -> None:
    with pytest.raises(ValidationError):
        compute_next_cadence(quantity=0, days_observed=7)
