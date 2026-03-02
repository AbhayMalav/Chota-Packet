"""
openrouter_models.py — Static fallback curated model list for FR-42.

This list is used when the live /api/v1/models fetch from OpenRouter fails
or the server starts without network access.

The backend can optionally refresh this list on startup and cache it.
Frontend caches the result in sessionStorage.
"""

from typing import TypedDict


class ModelMeta(TypedDict):
    id: str
    name: str
    cost_per_1k_tokens: float   # USD, approximate blended cost
    context_window: int         # tokens


STATIC_MODEL_LIST: list[ModelMeta] = [
    {
        "id": "local",
        "name": "Local Model (Free, Offline)",
        "cost_per_1k_tokens": 0.0,
        "context_window": 512,
    },
    {
        "id": "openai/gpt-4o",
        "name": "GPT-4o",
        "cost_per_1k_tokens": 0.005,
        "context_window": 128_000,
    },
    {
        "id": "openai/gpt-4o-mini",
        "name": "GPT-4o Mini",
        "cost_per_1k_tokens": 0.0002,
        "context_window": 128_000,
    },
    {
        "id": "anthropic/claude-3.5-sonnet",
        "name": "Claude 3.5 Sonnet",
        "cost_per_1k_tokens": 0.008,
        "context_window": 200_000,
    },
    {
        "id": "google/gemini-1.5-flash",
        "name": "Gemini 1.5 Flash",
        "cost_per_1k_tokens": 0.00035,
        "context_window": 1_000_000,
    },
    {
        "id": "meta-llama/llama-3.1-70b-instruct",
        "name": "Llama 3.1 70B",
        "cost_per_1k_tokens": 0.0008,
        "context_window": 131_072,
    },
    {
        "id": "mistralai/mistral-large",
        "name": "Mistral Large",
        "cost_per_1k_tokens": 0.004,
        "context_window": 128_000,
    },
]


def get_static_models() -> list[ModelMeta]:
    """Return the static model list as a plain list."""
    return STATIC_MODEL_LIST
