"""Schema-level tests for reviews and notifications (no DB required)."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.schemas.review import ReviewCreate, ReviewSummary


def test_review_rating_must_be_in_range() -> None:
    with pytest.raises(ValidationError):
        ReviewCreate(asin="A1", rating=0)
    with pytest.raises(ValidationError):
        ReviewCreate(asin="A1", rating=6)
    # Valid edges
    assert ReviewCreate(asin="A1", rating=1).rating == 1
    assert ReviewCreate(asin="A1", rating=5).rating == 5


def test_review_summary_defaults() -> None:
    summary = ReviewSummary(asin="A1")
    assert summary.average_rating is None
    assert summary.review_count == 0
