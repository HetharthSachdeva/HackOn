"""Intent-to-Cart: turn a natural-language prompt into a ready-to-checkout cart.

Pipeline:

1. Parse simple constraints from the prompt (budget, servings).
2. Use :mod:`app.services.semantic_search` to retrieve top-N candidates.
3. Greedily assemble a cart that respects the budget, preferring higher
   match score and well-reviewed in-stock items.
4. Call the configured LLM provider to produce a human-readable explanation
   and per-item rationale.
5. Optionally, mutate the user's actual cart by adding the chosen items.
"""

from __future__ import annotations

import re
from decimal import Decimal

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai import llm
from app.schemas.ai import IntentCartItem, IntentToCartResponse
from app.schemas.product import ProductSearchHit
from app.services import cart as cart_service
from app.services import semantic_search
from app.services import hybrid_search

log = structlog.get_logger(__name__)

# --- Prompt parsing --------------------------------------------------------

_BUDGET_RE = re.compile(
    r"""
    (?:under|below|less\s+than|<\s*=?|max(?:imum)?|upto|up\s+to|budget\s*(?:of|=)?)
    \s*
    (?:rs\.?|₹|inr)?\s*
    (\d{2,6})
    """,
    re.IGNORECASE | re.VERBOSE,
)
_SERVINGS_RE = re.compile(r"\bfor\s+(\d{1,2})\s*(?:people|persons?|guests?|pax)\b", re.IGNORECASE)
_TRAILING_AMOUNT_RE = re.compile(r"(?:rs\.?|₹|inr)\s*(\d{2,6})", re.IGNORECASE)


def parse_budget(prompt: str) -> Decimal | None:
    """Pull a numeric budget out of free text. Returns ``None`` if absent."""
    if m := _BUDGET_RE.search(prompt):
        try:
            return Decimal(m.group(1))
        except (ValueError, ArithmeticError):
            return None
    # Fallback: a bare "₹500" anywhere.
    if m := _TRAILING_AMOUNT_RE.search(prompt):
        try:
            return Decimal(m.group(1))
        except (ValueError, ArithmeticError):
            return None
    return None


def parse_servings(prompt: str) -> int | None:
    """Pull a servings hint (``for 4 people``) out of free text."""
    if m := _SERVINGS_RE.search(prompt):
        try:
            return int(m.group(1))
        except ValueError:
            return None
    return None


# --- Cart assembly ---------------------------------------------------------


def _rank_score(hit: ProductSearchHit) -> float:
    """Composite ranking: semantic score (primary) + rating bonus."""
    base = hit.score if hit.score is not None else 0.0
    stars_bonus = ((hit.stars or 0.0) - 3.5) * 0.02
    return base + stars_bonus


def _assemble(
    candidates: list[ProductSearchHit],
    *,
    budget: Decimal | None,
    max_items: int,
    servings: int | None,
) -> list[IntentCartItem]:
    """Greedy selection of items subject to the budget cap.

    Items are picked in rank order; each candidate is added with quantity 1
    (or with the servings hint, if it looks like a "main" item). If a pick
    would breach the budget we skip it and keep trying.
    """
    if not candidates:
        return []

    ranked = sorted(candidates, key=_rank_score, reverse=True)
    chosen: list[IntentCartItem] = []
    running = Decimal("0")

    # First pass — one of each, respecting budget.
    for hit in ranked:
        if len(chosen) >= max_items:
            break
        unit_price = Decimal(str(hit.price))
        if budget is not None and running + unit_price > budget:
            continue
        # Use servings as quantity for the first pick if provided (mains).
        qty = servings if (servings and not chosen) else 1
        line_total = unit_price * qty
        if budget is not None and running + line_total > budget:
            qty = 1
            line_total = unit_price
            if running + line_total > budget:
                continue
        chosen.append(
            IntentCartItem(
                asin=hit.asin,
                title=hit.title,
                quantity=qty,
                unit_price=unit_price,
                line_total=line_total,
                img_url=hit.img_url,
            )
        )
        running += line_total

    return chosen


# --- Orchestrator ---------------------------------------------------------


async def cart_from_intent(
    session: AsyncSession,
    *,
    prompt: str,
    user_id,  # uuid.UUID | None — None for unauthenticated guests
    budget: Decimal | None,
    max_items: int,
    apply_to_cart: bool,
) -> IntentToCartResponse:
    """Run the full pipeline and return a response payload."""
    # 1. Structured query decomposition using the LLM provider
    provider = llm.get_provider()
    log.info("intent_to_cart.start", prompt=prompt, provider=provider.name)
    extracted = await provider.parse_query(prompt)
    # 2. Parse budget & servings
    parsed_budget = budget
    if parsed_budget is None:
        if extracted.budget is not None and extracted.budget > 0:
            parsed_budget = Decimal(str(extracted.budget))
        else:
            parsed_budget = parse_budget(prompt)
    servings = parse_servings(prompt)

    # 3. Perform hybrid search for each decomposed search term
    results_by_item = await hybrid_search.search_hybrid(
        session, extracted, limit_per_item=max(15, max_items * 2)
    )

    # 4. Round-robin merge candidates list to construct final pool (ensures item coverage)
    candidates: list[ProductSearchHit] = []
    seen_asins = set()
    max_len = max(len(hits) for hits in results_by_item.values()) if results_by_item else 0
    
    for i in range(max_len):
        for item_query, hits_list in results_by_item.items():
            if i < len(hits_list):
                hit = hits_list[i]
                if hit.asin not in seen_asins:
                    seen_asins.add(hit.asin)
                    candidates.append(hit)

    log.info(
        "intent_to_cart.candidates",
        decomposed_items=extracted.items,
        n_candidates=len(candidates),
        budget=str(parsed_budget) if parsed_budget else None,
        servings=servings,
    )

    # 5. Greedy compilation of the cart under the budget
    chosen = _assemble(
        candidates,
        budget=parsed_budget,
        max_items=max_items,
        servings=servings,
    )

    # 6. Call LLM to provide explanations and rationales
    log.info("intent_to_cart.suggest_cart.start", provider=provider.name, candidates_count=len(chosen))
    suggestion = await provider.suggest_cart(
        prompt,
        [
            {
                "asin": item.asin,
                "title": item.title,
                "price": float(item.unit_price),
                "category": next(
                    (c.category for c in candidates if c.asin == item.asin), ""
                ),
                "tags": next((c.tags for c in candidates if c.asin == item.asin), ""),
                "score": next((c.score for c in candidates if c.asin == item.asin), None),
            }
            for item in chosen
        ],
        float(parsed_budget) if parsed_budget else None,
    )
    log.info("intent_to_cart.suggest_cart.complete", explanation=suggestion.explanation)

    items_with_rationale = [
        item.model_copy(
            update={"rationale": suggestion.rationale_by_asin.get(item.asin)}
        )
        for item in chosen
    ]

    subtotal = sum((it.line_total for it in items_with_rationale), Decimal("0"))
    over_budget = parsed_budget is not None and subtotal > parsed_budget

    applied = False
    if apply_to_cart and items_with_rationale:
        for item in items_with_rationale:
            await cart_service.add_item(session, user_id, item.asin, item.quantity)
        applied = True

    return IntentToCartResponse(
        prompt=prompt,
        explanation=suggestion.explanation,
        items=items_with_rationale,
        subtotal=subtotal,
        budget=parsed_budget,
        over_budget=over_budget,
        applied_to_cart=applied,
        used_semantic=True,  # Hybrid search uses both vector and keyword paths
    )
