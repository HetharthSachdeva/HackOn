"""Tests for the Gemma 4 LLM provider (Google AI Studio Gemini API)."""

from __future__ import annotations

from typing import Any

import httpx
import pytest

from app.ai import llm as llm_module
from app.ai.llm import (
    CartSuggestion,
    GemmaProvider,
    StubLLMProvider,
    _extract_json_object,
    get_provider,
    reset_provider_cache,
)
from app.core.config import get_settings

CANDIDATES = [
    {
        "asin": "A1",
        "title": "Sparkling water 500ml",
        "price": 35,
        "category": "Beverages",
        "tags": "low-sugar,fizzy",
        "score": 0.91,
    },
    {
        "asin": "A2",
        "title": "Lemon-mint cooler",
        "price": 60,
        "category": "Beverages",
        "tags": "summer",
        "score": 0.83,
    },
]


def _mock_transport(
    response_text: str,
    *,
    status_code: int = 200,
    capture: dict[str, Any] | None = None,
) -> httpx.MockTransport:
    """Build an httpx MockTransport that returns the Gemini-shaped envelope.

    Records the inbound request into ``capture`` (if provided) so the test can
    assert on URL, headers, and body shape.
    """

    def handler(request: httpx.Request) -> httpx.Response:
        if capture is not None:
            capture["request"] = request
        envelope = {
            "candidates": [
                {"content": {"parts": [{"text": response_text}]}},
            ]
        }
        return httpx.Response(status_code, json=envelope)

    return httpx.MockTransport(handler)


@pytest.fixture(autouse=True)
def _reset_provider_singleton() -> None:
    """Ensure no other test's cached provider leaks into this module."""
    reset_provider_cache()
    yield
    reset_provider_cache()


# --- pure helpers ----------------------------------------------------------


def test_extract_json_object_plain() -> None:
    assert _extract_json_object('{"a": 1}') == {"a": 1}


def test_extract_json_object_strips_markdown_fences() -> None:
    fenced = '```json\n{"a": 1, "b": "x"}\n```'
    assert _extract_json_object(fenced) == {"a": 1, "b": "x"}


def test_extract_json_object_recovers_from_surrounding_prose() -> None:
    noisy = 'Sure, here you go:\n{"a": 1}\nLet me know if you need more.'
    assert _extract_json_object(noisy) == {"a": 1}


def test_extract_json_object_returns_none_on_garbage() -> None:
    assert _extract_json_object("not json at all") is None


# --- constructor ------------------------------------------------------------


def test_gemma_requires_api_key() -> None:
    with pytest.raises(ValueError, match="LLM_API_KEY"):
        GemmaProvider(api_key="")


def test_gemma_uses_default_model_when_unspecified() -> None:
    provider = GemmaProvider(api_key="test-key")
    assert provider.model == "gemma-4-26b-a4b-it"


def test_gemma_respects_explicit_model() -> None:
    provider = GemmaProvider(api_key="test-key", model="gemma-4-31b-it")
    assert provider.model == "gemma-4-31b-it"


# --- HTTP request shape ----------------------------------------------------


@pytest.mark.anyio
async def test_gemma_complete_sends_expected_request(monkeypatch) -> None:
    capture: dict[str, Any] = {}
    transport = _mock_transport(response_text="hello world", capture=capture)

    real_async_client = httpx.AsyncClient

    def fake_async_client(*args: Any, **kwargs: Any) -> httpx.AsyncClient:
        kwargs["transport"] = transport
        return real_async_client(*args, **kwargs)

    monkeypatch.setattr(httpx, "AsyncClient", fake_async_client)

    provider = GemmaProvider(api_key="secret-key", model="gemma-4-26b-a4b-it")
    text = await provider.complete("be terse", "ping")

    assert text == "hello world"
    req: httpx.Request = capture["request"]
    assert (
        str(req.url)
        == "https://generativelanguage.googleapis.com/v1beta/models/gemma-4-26b-a4b-it:generateContent"
    )
    assert req.headers["x-goog-api-key"] == "secret-key"
    assert req.headers["content-type"].startswith("application/json")
    body = req.read().decode()
    assert '"role":"user"' in body
    assert '"ping"' in body
    assert '"systemInstruction"' in body
    assert '"be terse"' in body


# --- suggest_cart happy path -----------------------------------------------


@pytest.mark.anyio
async def test_gemma_suggest_cart_parses_real_json(monkeypatch) -> None:
    # Matches the responseSchema we send to Gemma: explanation + rationales array.
    model_reply = (
        '{"explanation": "Refreshing low-sugar combo for a hot afternoon.",'
        ' "rationales": ['
        '{"asin": "A1", "reason": "Zero sugar fizzy hydration."},'
        '{"asin": "A2", "reason": "Adds zingy lemon-mint flavor."}'
        "]}"
    )
    transport = _mock_transport(response_text=model_reply)
    real_client = httpx.AsyncClient
    monkeypatch.setattr(
        httpx,
        "AsyncClient",
        lambda *a, **kw: real_client(*a, **{**kw, "transport": transport}),
    )

    provider = GemmaProvider(api_key="k")
    result = await provider.suggest_cart("cold drinks", CANDIDATES, budget=200.0)

    assert isinstance(result, CartSuggestion)
    assert result.explanation == "Refreshing low-sugar combo for a hot afternoon."
    assert result.rationale_by_asin == {
        "A1": "Zero sugar fizzy hydration.",
        "A2": "Adds zingy lemon-mint flavor.",
    }


@pytest.mark.anyio
async def test_gemma_suggest_cart_fills_missing_rationales(monkeypatch) -> None:
    # Model only rationalizes one of two products — we should backfill the other.
    model_reply = (
        '{"explanation": "Picked the headliner.",'
        ' "rationales": [{"asin": "A1", "reason": "Best match."}]}'
    )
    transport = _mock_transport(response_text=model_reply)
    real_client = httpx.AsyncClient
    monkeypatch.setattr(
        httpx,
        "AsyncClient",
        lambda *a, **kw: real_client(*a, **{**kw, "transport": transport}),
    )

    provider = GemmaProvider(api_key="k")
    result = await provider.suggest_cart("cold drinks", CANDIDATES, budget=None)

    assert result.rationale_by_asin["A1"] == "Best match."
    assert "A2" in result.rationale_by_asin  # backfilled
    assert result.explanation == "Picked the headliner."


@pytest.mark.anyio
async def test_gemma_suggest_cart_sends_response_schema(monkeypatch) -> None:
    """We rely on responseSchema to suppress Gemma 4's verbose thinking."""
    capture: dict[str, Any] = {}
    transport = _mock_transport(
        response_text='{"explanation":"ok","rationales":[]}',
        capture=capture,
    )
    real_client = httpx.AsyncClient
    monkeypatch.setattr(
        httpx,
        "AsyncClient",
        lambda *a, **kw: real_client(*a, **{**kw, "transport": transport}),
    )

    provider = GemmaProvider(api_key="k")
    await provider.suggest_cart("cold drinks", CANDIDATES, budget=None)

    import json as _json

    body = _json.loads(capture["request"].read())
    gen_config = body["generationConfig"]
    assert gen_config["responseMimeType"] == "application/json"
    schema = gen_config["responseSchema"]
    assert schema["type"] == "OBJECT"
    assert set(schema["required"]) == {"explanation", "rationales"}
    assert schema["properties"]["rationales"]["type"] == "ARRAY"


# --- suggest_cart graceful degradation -------------------------------------


@pytest.mark.anyio
async def test_gemma_suggest_cart_falls_back_on_http_error(monkeypatch) -> None:
    transport = _mock_transport(response_text="", status_code=500)
    real_client = httpx.AsyncClient
    monkeypatch.setattr(
        httpx,
        "AsyncClient",
        lambda *a, **kw: real_client(*a, **{**kw, "transport": transport}),
    )

    provider = GemmaProvider(api_key="k")
    result = await provider.suggest_cart("cold drinks", CANDIDATES, budget=200.0)

    # Same shape as the stub fallback would produce: explanation mentions
    # budget, every candidate has a rationale.
    assert "200" in result.explanation
    assert set(result.rationale_by_asin) == {"A1", "A2"}


@pytest.mark.anyio
async def test_gemma_suggest_cart_falls_back_on_unparseable_response(
    monkeypatch,
) -> None:
    transport = _mock_transport(response_text="completely not JSON")
    real_client = httpx.AsyncClient
    monkeypatch.setattr(
        httpx,
        "AsyncClient",
        lambda *a, **kw: real_client(*a, **{**kw, "transport": transport}),
    )

    provider = GemmaProvider(api_key="k")
    result = await provider.suggest_cart("cold drinks", CANDIDATES, budget=None)

    assert set(result.rationale_by_asin) == {"A1", "A2"}


@pytest.mark.anyio
async def test_gemma_suggest_cart_empty_candidates_short_circuits() -> None:
    # No HTTP call should happen — stub fallback handles empties.
    provider = GemmaProvider(api_key="k")
    result = await provider.suggest_cart("anything", [], budget=None)
    assert result.rationale_by_asin == {}


# --- provider selection ----------------------------------------------------


def test_get_provider_returns_stub_when_provider_is_stub(monkeypatch) -> None:
    monkeypatch.setenv("LLM_PROVIDER", "stub")
    get_settings.cache_clear()
    reset_provider_cache()
    assert isinstance(get_provider(), StubLLMProvider)


def test_get_provider_returns_gemma_when_configured(monkeypatch) -> None:
    monkeypatch.setenv("LLM_PROVIDER", "gemma")
    monkeypatch.setenv("LLM_API_KEY", "test-key")
    monkeypatch.setenv("LLM_MODEL", "gemma-4-31b-it")
    get_settings.cache_clear()
    reset_provider_cache()
    provider = get_provider()
    assert isinstance(provider, GemmaProvider)
    assert provider.model == "gemma-4-31b-it"


def test_get_provider_falls_back_to_stub_when_gemma_key_missing(monkeypatch) -> None:
    monkeypatch.setenv("LLM_PROVIDER", "gemma")
    monkeypatch.setenv("LLM_API_KEY", "")
    get_settings.cache_clear()
    reset_provider_cache()
    assert isinstance(get_provider(), StubLLMProvider)


def teardown_module() -> None:
    """Restore the global settings cache for downstream tests."""
    get_settings.cache_clear()
    llm_module._provider = None
