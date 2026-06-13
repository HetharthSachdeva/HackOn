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
        return _stub_suggestion(prompt, candidates, budget)


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
    _TIMEOUT_SECONDS = 20.0

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

        async with httpx.AsyncClient(timeout=self._TIMEOUT_SECONDS) as client:
            resp = await client.post(
                url,
                headers={
                    "X-goog-api-key": self._api_key,
                    "Content-Type": "application/json",
                },
                json=body,
            )
            resp.raise_for_status()
            data = resp.json()

        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, TypeError) as exc:
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
            "Given a user's intent and a ranked list of candidate products, "
            "write a short customer-facing explanation (1-2 sentences) and a "
            "one-sentence rationale for each candidate (keyed by ASIN)."
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
            f"Candidates (already pre-selected; rationalize and explain):\n"
            f"{candidate_lines}"
        )

        # We use a responseSchema (Gemini API structured output) because Gemma 4
        # otherwise narrates its reasoning instead of emitting JSON. The schema
        # uses an *array of {asin, reason}* rather than an open-ended object map
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
                        },
                        "required": ["asin", "reason"],
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
        if payload is None:
            log.warning("gemma.suggest_cart_unparseable", raw=raw[:300])
            return _stub_suggestion(prompt, candidates, budget)

        explanation = str(payload.get("explanation", "")).strip()
        raw_rationales = payload.get("rationales") or []
        rationale_by_asin: dict[str, str] = {}
        if isinstance(raw_rationales, list):
            for entry in raw_rationales:
                if not isinstance(entry, dict):
                    continue
                asin = str(entry.get("asin") or "").strip()
                reason = str(entry.get("reason") or "").strip()
                if asin and reason:
                    rationale_by_asin[asin] = reason

        # Guarantee every candidate has a rationale, even if the model dropped one.
        for c in candidates:
            asin = str(c["asin"])
            rationale_by_asin.setdefault(
                asin,
                f"Matches \"{prompt}\" (category {c.get('category', 'n/a')}).",
            )

        if not explanation:
            explanation = (
                f"Based on \"{prompt}\", I picked {len(candidates)} item(s) "
                "matching your needs."
            )
        return CartSuggestion(
            explanation=explanation,
            rationale_by_asin=rationale_by_asin,
        )


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
