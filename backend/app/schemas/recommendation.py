"""Recommendation response schemas."""

from __future__ import annotations

from app.schemas.product import ProductRead


class RecommendationFeed:
    """Marker class — feeds are just `list[ProductRead]` for now."""


# Aliases — Phase 4 can split these into richer per-feed shapes.
TrendingResponse = list[ProductRead]
ForYouResponse = list[ProductRead]
