"""Provider-agnostic LLM wrapper.

Every concrete provider implements :class:`LLMProvider`. The default
:class:`StubLLMProvider` is deterministic, key-free, and good enough for
the hackathon demo. :class:`GemmaProvider` calls Google AI Studio's
Gemini API to talk to Gemma 4 (``gemma-4-26b-a4b-it`` /
``gemma-4-31b-it``). Activate it by setting in ``.env``::

    LLM_PROVIDER="gemma"
    LLM_API_KEY="<key from https://aistudio.google.com/apikey>"
    LLM_MODEL="gemma-4-26b-a4b-it"      # optional, this is the default

The same code path also works against any OpenAI-/Gemini-compatible proxy
by setting ``LLM_BASE_URL``. Other providers (openai / azure / anthropic
/ gemini) remain stubs of stubs until someone wires them up.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any, Protocol

import httpx
import structlog

from app.core.config import get_settings
from app.schemas.query_parser import ExtractedQuery

log = structlog.get_logger(__name__)


@dataclass(frozen=True, slots=True)
class ItemSuggestion:
    rationale: str
    quantity: int

@dataclass(frozen=True, slots=True)
class CartSuggestion:
    """Structured output expected from the LLM for Intent-to-Cart."""

    explanation: str
    suggestion_by_asin: dict[str, ItemSuggestion]


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

    async def parse_query(self, prompt: str) -> ExtractedQuery:
        """Decompose a natural language query into structured items, budget, preferences, and occasion."""
        ...


# ---------------------------------------------------------------------------
# Stub
# ---------------------------------------------------------------------------


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
        res = _stub_suggestion(prompt, candidates, budget)
        log.info("stub.suggest_cart.output", prompt=prompt, explanation=res.explanation)
        return res

    async def parse_query(self, prompt: str) -> ExtractedQuery:
        # Local regex patterns for budget and servings
        budget_re = re.compile(
            r"""
            (?:under|below|less\s+than|<\s*=?|max(?:imum)?|upto|up\s+to|budget\s*(?:of|=)?)
            \s*
            (?:rs\.?|₹|inr)?\s*
            (\d{2,6})
            """,
            re.IGNORECASE | re.VERBOSE,
        )
        servings_re = re.compile(r"\bfor\s+(\d{1,2})\s*(?:people|persons?|guests?|pax)\b", re.IGNORECASE)
        trailing_amount_re = re.compile(r"(?:rs\.?|₹|inr)\s*(\d{2,6})", re.IGNORECASE)

        # Parse budget
        budget_val = None
        if m := budget_re.search(prompt):
            try:
                budget_val = float(m.group(1))
            except ValueError:
                pass
        elif m := trailing_amount_re.search(prompt):
            try:
                budget_val = float(m.group(1))
            except ValueError:
                pass

        # Clean prompt
        clean = prompt
        clean = budget_re.sub("", clean)
        clean = servings_re.sub("", clean)
        clean = trailing_amount_re.sub("", clean)

        # Look for preferences
        preferences = []
        lower_prompt = prompt.lower()
        if "healthy" in lower_prompt or "organic" in lower_prompt:
            preferences.append("healthy")
        if "vegan" in lower_prompt:
            preferences.append("vegan")
        if "vegetarian" in lower_prompt:
            preferences.append("vegetarian")
        if "protein" in lower_prompt:
            preferences.append("high-protein")

        # Parse occasion
        occasion = None
        if "breakfast" in lower_prompt:
            occasion = "breakfast"
        elif "lunch" in lower_prompt:
            occasion = "lunch"
        elif "dinner" in lower_prompt:
            occasion = "dinner"
        elif "movie" in lower_prompt:
            occasion = "movie night"
        elif "snack" in lower_prompt or "munchies" in lower_prompt:
            occasion = "snacks"
        elif "party" in lower_prompt or "game night" in lower_prompt:
            occasion = "party"

        # Strip common fillers (including event/occasion noise like movie, night, party, etc. to prevent extracting them as item names)
        clean = re.sub(
            r"\b(under|below|budget|for|people|pax|guests?|persons?|need|want|buy|get|looking|for|a|an|the|of|inr|rs|₹|movie|night|party|event)\b",
            "",
            clean,
            flags=re.IGNORECASE,
        )

        # Split by comma or 'and' to get items
        parts = re.split(r",|\band\b", clean)
        items = []
        for p in parts:
            p_strip = p.strip()
            if not p_strip:
                continue
            # Remove leading/trailing adjectives from specific item search queries
            p_clean = re.sub(
                r"\b(healthy|organic|vegan|vegetarian|high-protein|delicious|tasty|fresh|cold|hot|quick)\b",
                "",
                p_strip,
                flags=re.IGNORECASE,
            ).strip()
            if p_clean:
                items.append(p_clean)

        # If items list is empty or is just a single long string with spaces, split by spaces
        if len(items) == 1 and " " in items[0]:
            words = [w.strip() for w in items[0].split() if len(w.strip()) > 2]
            if len(words) > 1:
                items = words
            else:
                items = [items[0]]

        if not items:
            items = ["snacks"]

        # Derive categories and tags based on occasion and preferences
        categories = []
        tags = []
        if occasion == "breakfast":
            categories.append("Groceries & Kitchen")
            tags.extend(["breakfast", "oats", "milk", "eggs", "fruits"])
        elif occasion in ("lunch", "dinner"):
            categories.append("Groceries & Kitchen")
            tags.extend(["dinner", "lunch", "dal", "rice", "naan", "vegetables"])
        elif occasion in ("party", "movie night", "snacks"):
            categories.extend(["Party Supplies", "Groceries & Kitchen"])
            tags.extend(["party", "snacks", "chips", "soda", "popcorn"])
        
        if "healthy" in preferences:
            categories.append("Health & Wellness")
            tags.append("healthy")

        # Fallback category if none matched
        if not categories:
            categories.append("Groceries & Kitchen")

        res = ExtractedQuery(
            items=items,
            budget=budget_val,
            occasion=occasion,
            preferences=preferences,
            categories=categories,
            tags=tags,
        )
        log.info("stub.parse_query.parsed", prompt=prompt, parsed=res.model_dump())
        return res


def _stub_suggestion(
    prompt: str,
    candidates: list[dict],
    budget: float | None,
) -> CartSuggestion:
    """Shared deterministic fallback used by the stub provider and as a safety
    net when a real provider errors."""
    if not candidates:
        return CartSuggestion(
            explanation="I couldn't find matching items in the catalog. Try a broader query.",
            suggestion_by_asin={},
        )

    budget_str = f" within your ₹{budget:g} budget" if budget else ""
    explanation = (
        f"Based on \"{prompt}\", I picked {len(candidates)} item(s) that closely "
        f"match what you described{budget_str}, prioritizing items that are in stock "
        f"and have the best customer ratings."
    )
    suggestion_by_asin = {
        c["asin"]: ItemSuggestion(
            rationale=f"Picked because it matches \"{prompt}\" "
            f"(category: {c.get('category', 'n/a')}, ₹{c.get('price', 0):g}).",
            quantity=1
        )
        for c in candidates
    }
    return CartSuggestion(
        explanation=explanation,
        suggestion_by_asin=suggestion_by_asin,
    )


# ---------------------------------------------------------------------------
# Gemma 4 (Google AI Studio / Gemini API)
# ---------------------------------------------------------------------------


class GemmaProvider:
    """Talk to Gemma 4 via the Google AI Studio Gemini API.

    The Gemini API exposes two hosted Gemma 4 variants:

    * ``gemma-4-26b-a4b-it`` — Mixture-of-Experts, fast + capable. **Default.**
    * ``gemma-4-31b-it`` — Largest dense model, highest quality.

    We talk to the REST endpoint directly with ``httpx`` to avoid pulling in
    the ``google-genai`` SDK as a dependency. The API key is sent via the
    ``X-goog-api-key`` header (never as a URL query string, so it doesn't
    leak into access logs).
    """

    name = "gemma"
    _DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
    _DEFAULT_MODEL = "gemma-4-26b-a4b-it"
    _TIMEOUT_SECONDS = 40.0

    def __init__(
        self,
        api_key: str,
        model: str = "",
        base_url: str = "",
    ) -> None:
        if not api_key:
            raise ValueError(
                "GemmaProvider requires LLM_API_KEY "
                "(get one at https://aistudio.google.com/apikey)"
            )
        self._api_key = api_key
        self._model = model or self._DEFAULT_MODEL
        self._base_url = (base_url or self._DEFAULT_BASE_URL).rstrip("/")

    @property
    def model(self) -> str:
        return self._model

    async def _generate(
        self,
        *,
        system: str | None,
        user: str,
        json_mode: bool = False,
        response_schema: dict[str, Any] | None = None,
        temperature: float = 0.4,
    ) -> str:
        url = f"{self._base_url}/models/{self._model}:generateContent"
        gen_config: dict[str, Any] = {"temperature": temperature}
        if json_mode or response_schema is not None:
            gen_config["responseMimeType"] = "application/json"
        if response_schema is not None:
            gen_config["responseSchema"] = response_schema

        body: dict[str, Any] = {
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": gen_config,
        }
        if system:
            body["systemInstruction"] = {"parts": [{"text": system}]}

        log.info(
            "gemma.generate.request",
            url=url,
            model=self._model,
            system=system,
            user=user,
            gen_config=gen_config,
        )

        try:
            async with httpx.AsyncClient(timeout=self._TIMEOUT_SECONDS) as client:
                resp = await client.post(
                    url,
                    headers={
                        "X-goog-api-key": self._api_key,
                        "Content-Type": "application/json",
                    },
                    json=body,
                )
                log.info("gemma.generate.http_status", status_code=resp.status_code)
                resp.raise_for_status()
                data = resp.json()
        except Exception as exc:
            log.error("gemma.generate.http_error", error=str(exc))
            raise

        try:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            log.info("gemma.generate.response", text=text)
            return text
        except (KeyError, IndexError, TypeError) as exc:
            log.error("gemma.generate.invalid_response_shape", data=data)
            raise RuntimeError(f"Unexpected Gemma response shape: {data!r}") from exc

    async def complete(self, system: str, user: str) -> str:
        try:
            return await self._generate(system=system or None, user=user)
        except Exception as exc:  # noqa: BLE001 — log and degrade gracefully
            log.warning("gemma.complete_failed", error=str(exc))
            return json.dumps({"error": "llm_unavailable", "detail": str(exc)})

    async def suggest_cart(
        self,
        prompt: str,
        candidates: list[dict],
        budget: float | None,
    ) -> CartSuggestion:
        if not candidates:
            return _stub_suggestion(prompt, candidates, budget)

        system = (
            "You are a shopping concierge for a quick-commerce app. "
            "Given a user's intent and a list of candidate products grouped into options, "
            "write a short customer-facing explanation (1-2 sentences) summarizing the curated choices. "
            "Then, provide a one-sentence rationale AND an ideal quantity for each candidate (keyed by ASIN). "
            "Your rationales should help the user decide between the alternatives (e.g. 'A premium option' or 'A budget-friendly choice'). "
            "Ensure the quantity correctly accounts for the number of people/servings in the intent and the product size (e.g. you might only need 1 family-size bag of chips for 5 people, but 5 individual drinks)."
        )
        budget_line = f"₹{budget:g}" if budget else "no explicit budget"
        candidate_lines = "\n".join(
            f"- ASIN {c['asin']}: {c.get('title', '')} — "
            f"₹{c.get('price', 0):g}, category {c.get('category', 'n/a')}, "
            f"tags {c.get('tags', '') or 'none'}, score {float(c.get('score', 0)):.2f}"
            for c in candidates
        )
        user_msg = (
            f"User intent: {prompt}\n"
            f"Budget: {budget_line}\n\n"
            f"Candidates (curated options; rationalize, explain, and provide quantity):\n"
            f"{candidate_lines}"
        )

        # We use a responseSchema (Gemini API structured output) because Gemma 4
        # otherwise narrates its reasoning instead of emitting JSON. The schema
        # uses an *array of {asin, reason, quantity}* rather than an open-ended object map
        # so that it stays well-defined under the Gemini schema dialect (which
        # doesn't support `additionalProperties`).
        schema = {
            "type": "OBJECT",
            "properties": {
                "explanation": {"type": "STRING"},
                "rationales": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "asin": {"type": "STRING"},
                            "reason": {"type": "STRING"},
                            "quantity": {"type": "INTEGER"},
                        },
                        "required": ["asin", "reason", "quantity"],
                    },
                },
            },
            "required": ["explanation", "rationales"],
        }

        try:
            raw = await self._generate(
                system=system,
                user=user_msg,
                response_schema=schema,
            )
        except Exception as exc:  # noqa: BLE001
            log.warning("gemma.suggest_cart_failed", error=str(exc))
            return _stub_suggestion(prompt, candidates, budget)

        payload = _extract_json_object(raw)
        log.info("gemma.suggest_cart.raw_response", raw=raw)
        if payload is None:
            log.warning("gemma.suggest_cart_unparseable", raw=raw[:300])
            return _stub_suggestion(prompt, candidates, budget)

        explanation = str(payload.get("explanation", "")).strip()
        raw_rationales = payload.get("rationales") or []
        suggestion_by_asin: dict[str, ItemSuggestion] = {}
        if isinstance(raw_rationales, list):
            for entry in raw_rationales:
                if not isinstance(entry, dict):
                    continue
                asin = str(entry.get("asin") or "").strip()
                reason = str(entry.get("reason") or "").strip()
                quantity = int(entry.get("quantity") or 1)
                if asin and reason:
                    suggestion_by_asin[asin] = ItemSuggestion(rationale=reason, quantity=quantity)

        # Guarantee every candidate has a rationale, even if the model dropped one.
        for c in candidates:
            asin = str(c["asin"])
            suggestion_by_asin.setdefault(
                asin,
                ItemSuggestion(
                    rationale=f"Matches \"{prompt}\" (category {c.get('category', 'n/a')}).",
                    quantity=1
                )
            )

        if not explanation:
            explanation = (
                f"Based on \"{prompt}\", I picked {len(candidates)} item(s) "
                "matching your needs."
            )

        log.info(
            "gemma.suggest_cart.parsed",
            prompt=prompt,
            explanation=explanation,
            suggestion_by_asin=suggestion_by_asin,
        )
        return CartSuggestion(
            explanation=explanation,
            suggestion_by_asin=suggestion_by_asin,
        )

    async def parse_query(self, prompt: str) -> ExtractedQuery:
        system = (
            "You are a query parsing assistant for a grocery and quick-commerce delivery app.\n"
            "Your job is to take a natural language request (describing an event, a recipe, a list of items, or a theme) "
            "and decompose it into a JSON object.\n\n"
            "The 8 known categories in our catalog are:\n"
            "- Groceries & Kitchen\n"
            "- Party Supplies\n"
            "- Electronics & Accessories\n"
            "- Household Essentials\n"
            "- Beauty & Personal Care\n"
            "- Health & Wellness\n"
            "- Baby & Child Care\n"
            "- Pet Care\n\n"
            "Decompose the query into a JSON object containing:\n"
            "- items: a list of specific, clean product search terms (e.g. ['snacks', 'chips', 'popcorn', 'cola']). "
            "CRITICAL: Do NOT include event, theme, or temporal words like 'movie', 'night', 'party', 'dinner', 'breakfast', 'lunch' as items. Instead, extract the actual food/drink/products requested or implied (e.g., if 'movie night' is mentioned, items should be snacks/drinks like 'popcorn', 'chips', 'soda', 'candy').\n"
            "- budget: a float number indicating the parsed budget limit, if any is mentioned in the prompt (otherwise null)\n"
            "- occasion: a string indicating the meal or event (e.g. 'breakfast', 'lunch', 'dinner', 'snacks', 'party', 'movie night', or null)\n"
            "- preferences: a list of string flags from: ['healthy', 'vegan', 'vegetarian', 'high-protein'] if mentioned or implied.\n"
            "- categories: a list of category names from the 8 known categories listed above that are highly relevant to the query\n"
            "- tags: a list of lowercase keyword tags relevant to the query (e.g. ['popcorn', 'chips', 'beverages', 'salty', 'sweet', 'party'])\n\n"
            "Return ONLY a JSON object matching the requested schema."
        )
        schema = {
            "type": "OBJECT",
            "properties": {
                "items": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"}
                },
                "budget": {
                    "type": "NUMBER"
                },
                "occasion": {
                    "type": "STRING"
                },
                "preferences": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"}
                },
                "categories": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"}
                },
                "tags": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"}
                }
            },
            "required": ["items", "preferences", "categories", "tags"]
        }

        try:
            raw = await self._generate(
                system=system,
                user=f"Decompose the following user query: {prompt}",
                response_schema=schema,
            )
            payload = _extract_json_object(raw)
            if payload is not None:
                # Handle cases where budget is returned but is float or int
                budget_val = payload.get("budget")
                budget_float = float(budget_val) if budget_val is not None else None
                res = ExtractedQuery(
                    items=[str(x).strip() for x in payload.get("items") or [] if str(x).strip()],
                    budget=budget_float,
                    occasion=str(payload.get("occasion")).strip() if payload.get("occasion") else None,
                    preferences=[str(x).strip().lower() for x in payload.get("preferences") or []],
                    categories=[str(x).strip() for x in payload.get("categories") or []],
                    tags=[str(x).strip().lower() for x in payload.get("tags") or []],
                )
                log.info("gemma.parse_query.parsed", prompt=prompt, parsed=res.model_dump())
                return res
            else:
                log.warning("gemma.parse_query.unparseable", prompt=prompt, raw=raw)
        except Exception as exc:
            log.warning("gemma.parse_query_failed", prompt=prompt, error=str(exc))

        # Fallback to stub parser
        stub = StubLLMProvider()
        return await stub.parse_query(prompt)


_JSON_OBJECT_RE = re.compile(r"\{.*\}", re.DOTALL)


def _extract_json_object(text: str) -> dict[str, Any] | None:
    """Best-effort extraction of a JSON object from a model response.

    Tolerates leading/trailing whitespace, ```json fences, and stray prose
    around the JSON block.
    """
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"```\s*$", "", text)
    try:
        result = json.loads(text)
    except json.JSONDecodeError:
        match = _JSON_OBJECT_RE.search(text)
        if not match:
            return None
        try:
            result = json.loads(match.group(0))
        except json.JSONDecodeError:
            return None
    return result if isinstance(result, dict) else None


# ---------------------------------------------------------------------------
# Selection
# ---------------------------------------------------------------------------


_provider: LLMProvider | None = None


def get_provider() -> LLMProvider:
    """Return the configured LLM provider (cached for the process lifetime)."""
    global _provider
    if _provider is not None:
        return _provider

    settings = get_settings()
    requested = settings.llm_provider

    if requested == "gemma":
        try:
            gemma = GemmaProvider(
                api_key=settings.llm_api_key,
                model=settings.llm_model,
                base_url=settings.llm_base_url,
            )
        except ValueError as exc:
            log.warning("llm.gemma_init_failed_falling_back_to_stub", error=str(exc))
        else:
            log.info("llm.provider_loaded", provider="gemma", model=gemma.model)
            _provider = gemma
            return _provider

    elif requested != "stub":
        log.warning(
            "llm.provider_not_implemented_falling_back_to_stub",
            requested=requested,
        )

    _provider = StubLLMProvider()
    return _provider


def reset_provider_cache() -> None:
    """Clear the cached provider — used by tests after mutating env."""
    global _provider
    _provider = None
