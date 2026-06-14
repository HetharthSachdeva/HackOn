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


def parse_budget(prompt: str | None) -> Decimal | None:
    """Pull a numeric budget out of free text. Returns ``None`` if absent."""
    if not prompt:
        return None
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


def parse_servings(prompt: str | None) -> int | None:
    """Pull a servings hint (``for 4 people``) out of free text."""
    if not prompt:
        return None
    if m := _SERVINGS_RE.search(prompt):
        try:
            return int(m.group(1))
        except ValueError:
            return None
    return None


# --- Orchestrator ---------------------------------------------------------

async def cart_from_intent(
    session: AsyncSession,
    *,
    prompt: str | None = None,
    image: str | None = None,
    user_id,  # uuid.UUID | None — None for unauthenticated guests
    budget: Decimal | None,
    max_items: int,
) -> IntentToCartResponse:
    """Run the full pipeline and return a response payload."""
    from app.schemas.ai import BundleComponent
    from fastapi import HTTPException

    if not prompt and not image:
        raise HTTPException(status_code=400, detail="Either prompt or image is required.")
    
    # 1. Structured query decomposition using the LLM provider
    provider = llm.get_provider()
    log.info("intent_to_cart.start", prompt=prompt, has_image=bool(image), provider=provider.name)
    extracted = await provider.parse_query(prompt, image_b64=image)
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
        session, extracted, limit_per_item=10, user_id=user_id
    )

    # 4. Group candidates horizontally into components (smart dedup by highest score)
    best_component_for_asin = {}
    for item_query, hits_list in results_by_item.items():
        for hit in hits_list:
            existing = best_component_for_asin.get(hit.asin)
            if not existing or (hit.score or 0) > existing[1]:
                best_component_for_asin[hit.asin] = (item_query, hit.score or 0, hit)

    components: list[BundleComponent] = []
    flat_candidates: list[ProductSearchHit] = []
    
    for item_query in results_by_item.keys():
        options: list[IntentCartItem] = []
        hits_for_this_comp = [
            hit for asin, (comp_name, score, hit) in best_component_for_asin.items()
            if comp_name == item_query
        ]
        # Sort them by score descending
        hits_for_this_comp.sort(key=lambda x: x.score or 0.0, reverse=True)
        
        for hit in hits_for_this_comp:
            flat_candidates.append(hit)
            
            unit_price = Decimal(str(hit.price))
            qty = servings if servings else 1
            line_total = unit_price * qty
            
            options.append(
                IntentCartItem(
                    asin=hit.asin,
                    title=hit.title,
                    quantity=qty,
                    unit_price=unit_price,
                    line_total=line_total,
                    img_url=hit.img_url,
                )
            )
            
            # Pass a larger pool of options to the LLM to curate from
            if len(options) >= 8:
                break
                
        if options:
            components.append(
                BundleComponent(
                    component_name=item_query.capitalize(),
                    options=options
                )
            )

    log.info(
        "intent_to_cart.components_assembled",
        decomposed_items=extracted.items,
        n_components=len(components),
        budget=str(parsed_budget) if parsed_budget else None,
        servings=servings,
    )

    # 5. Call LLM to provide explanations and rationales
    log.info("intent_to_cart.suggest_cart.start", provider=provider.name, candidates_count=len(flat_candidates))
    suggest_prompt = prompt or "Visual Snap-to-Cart"
    suggestion = await provider.suggest_cart(
        suggest_prompt,
        [
            {
                "asin": item.asin,
                "title": item.title,
                "price": float(item.price),
                "category": item.category,
                "tags": item.tags,
                "score": item.score,
            }
            for item in flat_candidates
        ],
        float(parsed_budget) if parsed_budget else None,
    )
    log.info("intent_to_cart.suggest_cart.complete", explanation=suggestion.explanation)

    # 6. Apply rationales and filter out items omitted by the LLM
    final_components = []
    for comp in components:
        valid_options = []
        for opt in comp.options:
            suggest = suggestion.suggestion_by_asin.get(opt.asin)
            if suggest:
                opt.rationale = suggest.rationale
                opt.quantity = suggest.quantity
                opt.line_total = opt.unit_price * opt.quantity
                valid_options.append(opt)
        
        if valid_options:
            comp.options = valid_options
            final_components.append(comp)

    explanation = suggestion.explanation
    if not final_components:
        explanation = "I couldn't find any relevant items for your request. Try adjusting your search."

    return IntentToCartResponse(
        prompt=prompt,
        explanation=explanation,
        components=final_components,
        budget=parsed_budget,
        used_semantic=True,  # Hybrid search uses both vector and keyword paths
    )
