"""
config.py - All named constants for Chota Packet backend.
Centralised here per NF-M3 (no magic numbers scattered through code).
"""

import os

# ──────────────────────────── Paths ─────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
MT5_MODEL_DIR = os.path.join(MODELS_DIR, "mt5_lora_merged")
WHISPER_MODEL_ID = "openai/whisper-tiny"   # downloaded once, cached by HuggingFace

# ──────────────────────────── Input limits ───────────────────────────────────

MAX_INPUT_CHARS: int = 512
MAX_AUDIO_SIZE_MB: int = 10
MAX_AUDIO_SIZE_BYTES: int = MAX_AUDIO_SIZE_MB * 1024 * 1024

# ──────────────────────────── Inference ──────────────────────────────────────

TARGET_SAMPLE_RATE: int = 16_000
MAX_NEW_TOKENS: int = 200
NUM_BEAMS: int = 4
VARIANT_TEMPERATURE: float = 0.8

# ──────────────────────────── Post-processing ────────────────────────────────

HALLUCINATION_MIN_TOKENS: int = 5
HALLUCINATION_NGRAM: int = 4
HALLUCINATION_MAX_REPEATS: int = 3

# ──────────────────────────── Timeouts ───────────────────────────────────────

ENHANCE_TIMEOUT_S: int = 15
STT_TIMEOUT_S: int = 12
HEALTH_TIMEOUT_S: int = 5
OPENROUTER_TIMEOUT_S: int = 15
VALIDATE_KEY_TIMEOUT_S: int = 5

# ──────────────────────────── CORS ───────────────────────────────────────────

_CORS_DEFAULTS: list[str] = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

def _parse_cors_origins() -> list[str]:
    """
    Build the CORS allowed-origins list from env + hardcoded dev defaults.
    Set CORS_ORIGINS in production as a comma-separated list of origins.
    Example: CORS_ORIGINS=https://chota-packet.vercel.app,https://custom-domain.com
    """
    raw = os.getenv("CORS_ORIGINS", "").strip()
    extra: list[str] = []
    if raw:
        extra = [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]

    merged: list[str] = []
    for origin in [*_CORS_DEFAULTS, *extra]:
        if origin not in merged:
            merged.append(origin)
    return merged

ALLOWED_ORIGINS: list[str] = _parse_cors_origins()

# ──────────────────────────── Task prefixes ───────────────────────────────────

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

# ──────────────────────────── OpenRouter ──────────────────────────────────────

OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
OPENROUTER_AUTH_ENDPOINT: str = f"{OPENROUTER_BASE_URL}/auth/key"
OPENROUTER_CHAT_ENDPOINT: str = f"{OPENROUTER_BASE_URL}/chat/completions"
OPENROUTER_MODELS_ENDPOINT: str = f"{OPENROUTER_BASE_URL}/models"

CLOUD_MAX_OUTPUT_TOKENS: int = 2_000
OPENROUTER_COST_PER_TOKEN: float = 0.000005

# ──────────────────────────── MIME types ──────────────────────────────────────

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
