"""
openrouter_models.py - Static fallback curated model list for FR-42.

Used when the live OpenRouter /api/v1/models fetch fails or the server
starts without network access. The frontend caches the result in
sessionStorage.

Visual ordering contract (enforced by PINNED_TOP_IDS and the /models sort):
  1. Local model   — always first (free, offline)
  2. Auto Router   — always second (OpenRouter smart routing)
  3. Free models   — zero cost, sorted alphabetically
  4. Paid models   — ascending cost_per_1k_tokens, then name

Pricing: approximate blended (input+output)/2 in USD per 1k tokens.
Last verified: 2026-03. Always prefer live /models data over these values.
"""

from __future__ import annotations

from typing import TypedDict

LAST_UPDATED = "2026-03"


class ModelMeta(TypedDict):
    id: str
    name: str
    cost_per_1k_tokens: float  # USD, approximate blended (input+output)/2
    context_window: int        # tokens


# IDs that are always pinned to the top of the list, in this exact order.
# The /models route uses this to sort the live OpenRouter list correctly.
PINNED_TOP_IDS: list[str] = ["local", "openrouter/auto"]

STATIC_MODEL_LIST: list[ModelMeta] = [
    # ── Tier 0: Always pinned ────────────────────────────────────────────────
    {
        "id": "local",
        "name": "Local Model (Free, Offline)",
        "cost_per_1k_tokens": 0.0,
        "context_window": 512,
    },
    {
        # Routes to the best available model automatically — cost varies
        "id": "openrouter/auto",
        "name": "Auto Router (Best Available)",
        "cost_per_1k_tokens": 0.0,   # Cost shown as 0 — varies per underlying model
        "context_window": 200_000,
    },
    # ── Tier 1: Free models ──────────────────────────────────────────────────
    {
        # DeepSeek R1 free tier — strong reasoning, rate-limited
        "id": "deepseek/deepseek-r1:free",
        "name": "DeepSeek R1 (Free)",
        "cost_per_1k_tokens": 0.0,
        "context_window": 163_840,
    },
    {
        # Kimi K2.5 — currently the most-used free model on OpenRouter
        "id": "moonshotai/kimi-k2.5:free",
        "name": "Kimi K2.5 (Free)",
        "cost_per_1k_tokens": 0.0,
        "context_window": 131_072,
    },
    {
        # Gemini 2.0 Flash free tier — very generous rate limits
        "id": "google/gemini-2.0-flash-exp:free",
        "name": "Gemini 2.0 Flash (Free)",
        "cost_per_1k_tokens": 0.0,
        "context_window": 1_048_576,
    },
    # ── Tier 2: Paid models, ascending cost ──────────────────────────────────
    {
        "id": "openai/gpt-4o-mini",
        "name": "GPT-4o Mini",
        "cost_per_1k_tokens": 0.0002,
        "context_window": 128_000,
    },
    {
        "id": "meta-llama/llama-4-maverick",
        "name": "Llama 4 Maverick",
        "cost_per_1k_tokens": 0.0008,
        "context_window": 131_072,
    },
    {
        "id": "mistralai/mistral-small-3.1",
        "name": "Mistral Small 3.1",
        "cost_per_1k_tokens": 0.0011,
        "context_window": 128_000,
    },
    {
        "id": "google/gemini-2.5-flash",
        "name": "Gemini 2.5 Flash",
        "cost_per_1k_tokens": 0.0014,
        "context_window": 1_048_576,
    },
    {
        "id": "openai/gpt-4o",
        "name": "GPT-4o",
        "cost_per_1k_tokens": 0.0015,
        "context_window": 128_000,
    },
    {
        "id": "deepseek/deepseek-r1",
        "name": "DeepSeek R1",
        "cost_per_1k_tokens": 0.0040,
        "context_window": 163_840,
    },
    {
        "id": "anthropic/claude-sonnet-4-5",
        "name": "Claude Sonnet 4.5",
        "cost_per_1k_tokens": 0.0090,
        "context_window": 200_000,
    },
]


def get_static_models() -> list[ModelMeta]:
    """
    Return a shallow copy of the static model list.

    Order is guaranteed: pinned (local → auto router) → free → paid by cost.
    Returns a copy so callers cannot mutate the module-level global.
    """
    return list(STATIC_MODEL_LIST)