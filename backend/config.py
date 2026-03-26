"""
config.py - All named constants for Chota Packet backend.
Centralised here per NF-M3 (no magic numbers scattered through code).
"""

from __future__ import annotations

import logging
import os

logger = logging.getLogger(__name__)

# ──────────────────────────── Paths ──────────────────────────────────────────

BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
MT5_MODEL_DIR = os.path.join(BASE_DIR, "models", "mt5_lora_merged")

# Must be a valid HuggingFace model ID — downloaded once, then cached locally.
# Changing this to a non-existent ID will raise a HuggingFace 404 at startup.
WHISPER_MODEL_ID: str = "openai/whisper-tiny"

# ──────────────────────────── Input limits ───────────────────────────────────

MAX_INPUT_CHARS: int = 512

_MAX_AUDIO_SIZE_MB: int = 10                            # internal intermediate
MAX_AUDIO_SIZE_BYTES: int = _MAX_AUDIO_SIZE_MB * 1024 * 1024

# ──────────────────────────── Inference ──────────────────────────────────────

TARGET_SAMPLE_RATE: int       = 16_000
MAX_NEW_TOKENS: int           = 200
NUM_BEAMS: int                = 4
VARIANT_TEMPERATURE: float    = 0.8

# Combined cap for system_prompt + prefix + user text fed to the mT5 tokenizer.
# Raise to 1024 if you observe silent truncation on long system prompts.
MAX_TOKENIZER_INPUT_TOKENS: int = 512

# ──────────────────────────── Post-processing ────────────────────────────────

HALLUCINATION_MIN_TOKENS: int  = 5
HALLUCINATION_NGRAM: int       = 4
HALLUCINATION_MAX_REPEATS: int = 3

# ──────────────────────────── Timeouts ───────────────────────────────────────

# Applied on outbound OpenRouter HTTP calls (httpx).
OPENROUTER_TIMEOUT_S: int    = 15
VALIDATE_KEY_TIMEOUT_S: int  = 5

# Reserved for future middleware-level request timeouts on /enhance and /stt.
# Currently NOT enforced — adding a TimeoutMiddleware to main.py will use these.
ENHANCE_TIMEOUT_S: int = 15
STT_TIMEOUT_S: int     = 30   # generous for long audio files; ffmpeg hard-limited to 30s

# ──────────────────────────── CORS ───────────────────────────────────────────

# Dev origins — covers both CRA (3000) and Vite (5173) defaults.
# Override in production via the CORS_ORIGINS env var.
_CORS_DEFAULTS: list[str] = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


def _parse_cors_origins() -> list[str]:
    """
    Build the CORS allowed-origins list from env + hardcoded dev defaults.

    Set CORS_ORIGINS in production as a comma-separated list of full origins.
    Example:
        CORS_ORIGINS=https://chota-packet.vercel.app,https://custom-domain.com

    Each value must be a full origin (scheme + host, no trailing slash).
    Wildcard '*' is rejected — use explicit origins for security.
    """
    raw = os.getenv("CORS_ORIGINS", "").strip()
    extra: list[str] = []

    if raw:
        candidates = [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]
        for origin in candidates:
            if origin == "*":
                logger.warning(
                    "[config] CORS_ORIGINS='*' is not allowed — "
                    "use explicit origins. Skipping wildcard."
                )
                continue
            if not origin.startswith(("http://", "https://")):
                logger.warning(
                    "[config] Skipping invalid CORS origin (must start with "
                    "http:// or https://): '%s'",
                    origin,
                )
                continue
            extra.append(origin)

    merged: list[str] = []
    for origin in [*_CORS_DEFAULTS, *extra]:
        if origin not in merged:
            merged.append(origin)
    return merged


ALLOWED_ORIGINS: list[str] = _parse_cors_origins()

# ──────────────────────────── Task prefixes ──────────────────────────────────

TASK_PREFIXES: dict[str, str] = {
    "en": "enhance prompt",
    "hi": "prompt sudharo",
}

STYLE_MAP: dict[str, str] = {
    "general":    "",
    "stepbystep": "step-by-step",
    "code":       "code",
    "creative":   "creative",
    "data":       "data analysis",
    "detailed":   "detailed",
    "academic":   "academic",
    "marketing":  "marketing",
}

TONE_MAP: dict[str, str] = {
    "":          "",
    "formal":    "formal",
    "casual":    "casual",
    "technical": "technical",
}

# ──────────────────────────── OpenRouter ─────────────────────────────────────

_OPENROUTER_BASE_URL: str       = "https://openrouter.ai/api/v1"
OPENROUTER_AUTH_ENDPOINT: str   = f"{_OPENROUTER_BASE_URL}/auth/key"
OPENROUTER_CHAT_ENDPOINT: str   = f"{_OPENROUTER_BASE_URL}/chat/completions"
OPENROUTER_MODELS_ENDPOINT: str = f"{_OPENROUTER_BASE_URL}/models"

CLOUD_MAX_OUTPUT_TOKENS: int = 2_000

# Blended average cost per token (USD) used for display-only cost estimates.
# Based on a mid-tier model average (approx. GPT-4o-mini / Mistral range).
# This is NOT used for billing — live usage.total_tokens * this = UI estimate only.
# Last reviewed: 2026-03. Update when your typical model mix changes significantly.
OPENROUTER_COST_PER_TOKEN: float = 0.000005

# ──────────────────────────── MIME types ─────────────────────────────────────

ALLOWED_AUDIO_MIMES: set[str] = {
    "audio/webm",
    "audio/ogg",
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",
}

# ──────────────────────────── Devanagari Unicode range ───────────────────────

DEVANAGARI_START: int = 0x0900
DEVANAGARI_END: int   = 0x097F