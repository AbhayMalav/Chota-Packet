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

MAX_INPUT_CHARS: int = 512          # Truncate/reject longer inputs (FR-01)
MAX_AUDIO_SIZE_MB: int = 10         # Audio upload size cap (FR-15)
MAX_AUDIO_SIZE_BYTES: int = MAX_AUDIO_SIZE_MB * 1024 * 1024

# ──────────────────────────── Inference ──────────────────────────────────────

TARGET_SAMPLE_RATE: int = 16_000    # Required by Whisper (FR-04)
MAX_NEW_TOKENS: int = 200           # mT5 generation cap (FR-06)
NUM_BEAMS: int = 4                  # Beam search width (FR-06)
VARIANT_TEMPERATURE: float = 0.8   # Sampling temp for variant_mode (FR-29)

# ──────────────────────────── Post-processing ────────────────────────────────

HALLUCINATION_MIN_TOKENS: int = 5   # Minimum output token count (FR-16)
HALLUCINATION_NGRAM: int = 4        # N-gram size for repetition check (FR-16)
HALLUCINATION_MAX_REPEATS: int = 3  # Max times an n-gram may appear (FR-16)

# ──────────────────────────── Timeouts ───────────────────────────────────────

ENHANCE_TIMEOUT_S: int = 15         # /enhance Axios timeout (FR-14) - frontend reference only, not used by backend
STT_TIMEOUT_S: int = 12             # /stt Axios timeout (FR-14) - frontend reference only, not used by backend
HEALTH_TIMEOUT_S: int = 5           # /health check timeout (FR-13)
OPENROUTER_TIMEOUT_S: int = 15      # Cloud inference timeout (NF-P8)
VALIDATE_KEY_TIMEOUT_S: int = 5     # Key validation timeout (NF-P9)

# ──────────────────────────── CORS ───────────────────────────────────────────

ALLOWED_ORIGINS: list[str] = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# ──────────────────────────── Task prefixes ───────────────────────────────────

TASK_PREFIXES: dict[str, str] = {
    "en": "enhance prompt",
    "hi": "prompt sudharo",
}

# Style tag inserted between prefix and colon:  "enhance prompt [code]: "
STYLE_MAP: dict[str, str] = {
    "general":    "",           # No tag - uses plain prefix
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

# Cloud output guard-rail (NF-R8)
CLOUD_MAX_OUTPUT_TOKENS: int = 2_000
OPENROUTER_COST_PER_TOKEN: float = 0.000005  # $5 per 1M tokens blended avg

# ──────────────────────────── MIME types ──────────────────────────────────────

ALLOWED_AUDIO_MIMES: set[str] = {
    "audio/webm",
    "audio/ogg",
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",   # mp3 - converted server-side
}

# ──────────────────────────── Devanagari Unicode range ───────────────────────

DEVANAGARI_START: int = 0x0900
DEVANAGARI_END: int   = 0x097F
