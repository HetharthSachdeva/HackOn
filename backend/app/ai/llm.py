"""Provider-agnostic LLM wrapper.

Every concrete provider implements :class:`LLMProvider`. The default
:class:`StubLLMProvider` is deterministic, key-free, and good enough for
the hackathon demo. Swap in OpenAI / Anthropic / Gemini by:

1. Implementing the protocol in a new class.
2. Selecting it in ``LLM_PROVIDER`` (and supplying ``LLM_API_KEY``).
3. Wiring it up in :func:`get_provider`.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Protocol

import structlog

from app.core.config import get_settings

log = structlog.get_logger(__name__)


@dataclass(frozen=True, slots=True)
class CartSuggestion:
    """Structured output expected from the LLM for Intent-to-Cart."""

    explanation: str
    rationale_by_asin: dict[str, str]


class LLMProvider(Protocol):
    """The shape every provider must implement."""

    name: str

    async def complete(self, system: str, user: str) -> str:
        """Return a free-form completion. Used for generic prompts."""
        ...

    async def suggest_cart(
        self,
        prompt: str,
        candidates: list[dict],
        budget: float | None,
    ) -> CartSuggestion:
        """Pick and rationalize a cart from ``candidates``.

        ``candidates`` is a list of ``{asin, title, price, category, tags, score}``
        dicts ranked by semantic similarity to ``prompt``.
        """
        ...


class StubLLMProvider:
    """Deterministic, key-free fallback.

    Generates plausible-looking explanations using simple templating.
    """

    name = "stub"

    async def complete(self, system: str, user: str) -> str:
        return json.dumps({"echo": user[:200]})

    async def suggest_cart(
        self,
        prompt: str,
        candidates: list[dict],
        budget: float | None,
    ) -> CartSuggestion:
        if not candidates:
            return CartSuggestion(
                explanation="I couldn't find matching items in the catalog. Try a broader query.",
                rationale_by_asin={},
            )

        budget_str = f" within your ₹{budget:g} budget" if budget else ""
        explanation = (
            f"Based on \"{prompt}\", I picked {len(candidates)} item(s) that closely "
            f"match what you described{budget_str}, prioritizing items that are in stock "
            "and have the best customer ratings."
        )
        rationale_by_asin = {
            c["asin"]: f"Picked because it matches \"{prompt}\" "
            f"(category: {c.get('category', 'n/a')}, ₹{c.get('price', 0):g})."
            for c in candidates
        }
        return CartSuggestion(
            explanation=explanation,
            rationale_by_asin=rationale_by_asin,
        )


_provider: LLMProvider | None = None


def get_provider() -> LLMProvider:
    """Return the configured LLM provider (cached)."""
    global _provider
    if _provider is not None:
        return _provider

    settings = get_settings()
    if settings.llm_provider != "stub":
        log.warning(
            "llm.provider_not_implemented_falling_back_to_stub",
            requested=settings.llm_provider,
        )
    # All other providers are stubs of stubs for now — plug in real SDKs here.
    _provider = StubLLMProvider()
    return _provider
