"""
routes.py — All FastAPI route handlers for Chota Packet (FR-03, FR-04, FR-06, FR-13, FR-38, FR-41, FR-42).

Endpoints:
  GET  /health          — FR-13, FR-38, FR-19
  POST /stt             — FR-04, FR-15
  POST /enhance         — FR-06, FR-21, FR-24, FR-27, FR-29, FR-30, FR-42
  POST /validate-key    — FR-41
  GET  /models          — FR-42
"""

from __future__ import annotations

import logging
import re
from typing import Literal, Optional, Annotated

import httpx
from fastapi import APIRouter, Request, HTTPException, UploadFile, File, Form, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator, Field

from config import (
    MAX_INPUT_CHARS,
    MAX_AUDIO_SIZE_BYTES,
    ALLOWED_AUDIO_MIMES,
    OPENROUTER_AUTH_ENDPOINT,
    OPENROUTER_CHAT_ENDPOINT,
    OPENROUTER_MODELS_ENDPOINT,
    OPENROUTER_TIMEOUT_S,
    VALIDATE_KEY_TIMEOUT_S,
    CLOUD_MAX_OUTPUT_TOKENS,
    OPENROUTER_COST_PER_TOKEN,
    STYLE_MAP,
    TONE_MAP,
)
from enhancement_prompts import ENHANCEMENT_SYSTEM_PROMPTS
from models import build_prefix, run_local_enhance, run_stt
from openrouter_models import get_static_models

logger = logging.getLogger(__name__)
router = APIRouter()


# ──────────────────────────── Pydantic models ─────────────────────────────────

class EnhanceRequest(BaseModel):
    """Full /enhance request body. All new parameters are optional with safe defaults."""

    text: str = Field(..., min_length=1, max_length=MAX_INPUT_CHARS)
    input_lang: Literal["hi", "en"] = "en"
    output_lang: Literal["hi", "en", "auto"] = "auto"
    style: str = "general"
    tone: Literal["formal", "casual", "technical", ""] = ""
    enhancement_level: Literal["basic", "detailed", "advanced"] = "basic"
    variant_mode: bool = False
    inference_mode: Literal["local", "cloud"] = "local"
    model: Optional[str] = None

    @field_validator("style")
    @classmethod
    def validate_style(cls, v: str) -> str:
        if v not in STYLE_MAP:
            logger.warning("Unknown style '%s' — falling back to 'general'", v)
            return "general"
        return v

    @field_validator("enhancement_level")
    @classmethod
    def validate_level(cls, v: str) -> str:
        if v not in ENHANCEMENT_SYSTEM_PROMPTS:
            logger.warning("Unknown enhancement_level '%s' — falling back to 'basic'", v)
            return "basic"
        return v


class ValidateKeyRequest(BaseModel):
    key: str = Field(..., min_length=1)


# ──────────────────────────── GET /health ─────────────────────────────────────

@router.get("/health")
async def health_check(request: Request) -> JSONResponse:
    """
    Lightweight health probe (FR-13, FR-38, FR-19).
    Returns models_loaded status and ffmpeg availability.
    """
    models = request.app.state.models
    return JSONResponse({
        "status": "ok" if models.loaded else "error",
        "models_loaded": models.loaded,
        "mock_mode": getattr(models, "mock_mode", True),
        "ffmpeg_available": request.app.state.ffmpeg_available,
        "detail": models.load_error,
    })


# ──────────────────────────── POST /stt ──────────────────────────────────────

@router.post("/stt")
async def transcribe_audio(
    request: Request,
    audio: UploadFile = File(...),
    lang: str = Form(default="en"),
) -> JSONResponse:
    """
    Speech-to-text transcription using Whisper Tiny (FR-04, FR-15, FR-38).
    """
    # Guard: models loaded?
    models = request.app.state.models
    if not models.loaded:
        raise HTTPException(
            status_code=503,
            detail="Models not loaded. Check server logs.",
        )

    # Guard: ffmpeg available (FR-38)
    if not request.app.state.ffmpeg_available and not models.mock_mode:
        raise HTTPException(
            status_code=503,
            detail="Audio processing unavailable. Server is missing ffmpeg dependency.",
        )

    # Guard: file size (FR-15)
    audio_bytes = await audio.read()
    if len(audio_bytes) > MAX_AUDIO_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid audio file",
                "detail": f"File exceeds {MAX_AUDIO_SIZE_BYTES // (1024*1024)} MB limit.",
            },
        )

    # Guard: Magic bytes check for audio files
    header = audio_bytes[:12]
    is_valid_audio = (
        header.startswith(b"\x1A\x45\xDF\xA3") or  # WebM
        header.startswith(b"OggS") or              # Ogg
        (header.startswith(b"RIFF") and header[8:12] == b"WAVE") or # Wav
        header.startswith(b"ID3") or header.startswith(b"\xFF\xFB") or 
        header.startswith(b"\xFF\xF3") or header.startswith(b"\xFF\xFA") # MP3 variants
    )
    if not is_valid_audio:
        logger.warning("Rejected file upload: Invalid magic bytes %r", header)
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid audio file",
                "detail": "The uploaded file does not appear to be a valid audio format.",
            },
        )

    # Guard: MIME type header (FR-15)
    content_type = audio.content_type or ""
    if content_type and content_type not in ALLOWED_AUDIO_MIMES:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid audio file",
                "detail": f"Unsupported MIME type: {content_type}.",
            },
        )

    # Guard: language value
    if lang not in ("hi", "en"):
        lang = "en"

    try:
        transcript, warning = run_stt(
            audio_bytes=audio_bytes,
            lang=lang,
            whisper_processor=models.whisper_processor,
            whisper_model=models.whisper_model,
            mock_mode=models.mock_mode,
        )
    except ValueError as exc:
        logger.warning("STT transcription value error: %s", exc)
        raise HTTPException(status_code=400, detail={"error": "Transcription failed", "detail": "Audio processing failed. Please ensure the file is a valid audio format."})
    except Exception as exc:
        logger.exception("STT unexpected error: %s", exc)
        raise HTTPException(status_code=500, detail={"error": "Transcription failed", "detail": "An internal server error occurred during transcription."})

    payload: dict = {"text": transcript}
    if warning:
        payload["warning"] = warning
    return JSONResponse(payload)


# ──────────────────────────── POST /enhance ───────────────────────────────────

@router.post("/enhance")
async def enhance_prompt(
    req: EnhanceRequest,
    request: Request,
    x_openrouter_key: Annotated[Optional[str], Header()] = None,
) -> JSONResponse:
    """
    Prompt enhancement — local mT5 or cloud OpenRouter path (FR-06, FR-27–FR-30, FR-42).
    """
    models = request.app.state.models
    if not models.loaded:
        raise HTTPException(status_code=503, detail="Models not loaded. Check server logs.")

    # Truncate if over limit (FR-01)
    text = req.text[:MAX_INPUT_CHARS]

    system_prompt = ENHANCEMENT_SYSTEM_PROMPTS.get(req.enhancement_level, ENHANCEMENT_SYSTEM_PROMPTS["basic"])
    prefix = build_prefix(
        input_lang=req.input_lang,
        style=req.style,
        tone=req.tone,
        enhancement_level=req.enhancement_level,
        output_lang=req.output_lang,
    )

    # ── Cloud path ────────────────────────────────────────────────────────────
    if req.inference_mode == "cloud" and req.model and req.model != "local":
        if not x_openrouter_key:
            raise HTTPException(
                status_code=400,
                detail={"error": "X-OpenRouter-Key header required for cloud inference."},
            )
        return await _cloud_enhance(req, text, prefix, system_prompt, x_openrouter_key)

    # ── Local mT5 path ────────────────────────────────────────────────────────
    try:
        enhanced = run_local_enhance(
            text=text,
            prefix=prefix,
            system_prompt=system_prompt,
            variant_mode=req.variant_mode,
            mt5_tokenizer=models.mt5_tokenizer,
            mt5_model=models.mt5_model,
            mock_mode=models.mock_mode,
        )
    except ValueError as exc:
        logger.warning("Enhancement failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail={"error": "Enhancement failed. Please rephrase your input and try again."},
        )
    except Exception as exc:
        logger.exception("Unexpected enhance error")
        raise HTTPException(
            status_code=500,
            detail={"error": "Enhancement failed. Please rephrase your input and try again."},
        )

    return JSONResponse({
        "enhanced_prompt": enhanced,
        "model_used": "mock-mt5" if models.mock_mode else "mt5-small-lora",
        "cost_estimate": None,
        "mock_mode": models.mock_mode,
    })


async def _cloud_enhance(
    req: EnhanceRequest,
    text: str,
    prefix: str,
    system_prompt: str,
    api_key: str,
) -> JSONResponse:
    """
    Forward enhancement request to OpenRouter (FR-42, NF-S7).
    The backend proxies the call — the key is never exposed to the browser.
    """
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"{prefix}{text}"},
    ]

    payload = {
        "model": req.model,
        "messages": messages,
        "max_tokens": CLOUD_MAX_OUTPUT_TOKENS,
        "temperature": 0.7,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",  # Required by OpenRouter
        "X-Title": "Chota Packet",
    }

    try:
        async with httpx.AsyncClient(timeout=OPENROUTER_TIMEOUT_S) as client:
            resp = await client.post(OPENROUTER_CHAT_ENDPOINT, json=payload, headers=headers)
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail={"error": "Cloud model request timed out. Try again or switch to the local model."},
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=503,
            detail={"error": "OpenRouter is temporarily unavailable. The local model is still available."},
        )

    # Map OpenRouter HTTP errors (FR-42 edge cases)
    if resp.status_code == 401:
        raise HTTPException(
            status_code=401,
            detail={"error": "Invalid or expired OpenRouter API key.", "detail": "Please update it in Settings."},
        )
    if resp.status_code == 402:
        raise HTTPException(
            status_code=402,
            detail={"error": "Insufficient OpenRouter credits.", "detail": "Add credits at openrouter.ai or switch to the local model."},
        )
    if resp.status_code == 429:
        retry_after = resp.headers.get("retry-after", "unknown")
        raise HTTPException(
            status_code=429,
            detail={"error": "Rate limited by OpenRouter.", "retry_after": retry_after},
        )
    if resp.status_code >= 500:
        raise HTTPException(
            status_code=503,
            detail={"error": "OpenRouter is temporarily unavailable. The local model is still available."},
        )

    try:
        data = resp.json()
        content = data["choices"][0]["message"]["content"].strip()
        if not content:
            raise ValueError("Empty content from cloud model")
    except (KeyError, IndexError, ValueError) as exc:
        raise HTTPException(
            status_code=500,
            detail={"error": "Enhancement failed. Please rephrase your input and try again."},
        )

    # Cost estimate from usage field if present
    usage = data.get("usage", {})
    total_tokens = usage.get("total_tokens", 0)
    # Cost estimate using configured blended average
    cost = round(total_tokens * OPENROUTER_COST_PER_TOKEN, 6) if total_tokens else None

    return JSONResponse({
        "enhanced_prompt": content,
        "model_used": req.model,
        "cost_estimate": cost,
        "mock_mode": False,
    })


# ──────────────────────────── POST /validate-key ─────────────────────────────

@router.post("/validate-key")
async def validate_openrouter_key(req: ValidateKeyRequest) -> JSONResponse:
    """
    Validate an OpenRouter API key (FR-41).
    Checks format first, then calls OpenRouter /auth/key to verify it's active.
    """
    # Format check (client-side redundancy)
    if not re.match(r"^sk-or-v1-[a-zA-Z0-9]{32,}$", req.key):
        raise HTTPException(
            status_code=400,
            detail={"error": "Invalid key format. Expected: sk-or-v1-..."},
        )

    headers = {
        "Authorization": f"Bearer {req.key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=VALIDATE_KEY_TIMEOUT_S) as client:
            resp = await client.get(OPENROUTER_AUTH_ENDPOINT, headers=headers)
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=408,
            detail={"error": "Validation timed out. Check internet connection."},
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail={"error": "Could not reach OpenRouter. Try again later."},
        )

    if resp.status_code == 401:
        return JSONResponse({"valid": False, "reason": "Invalid or revoked API key."})
    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail={"error": "Could not validate key — unknown OpenRouter response."},
        )

    data = resp.json().get("data", resp.json())
    credits = data.get("limit_remaining", data.get("usage", {}).get("credits", None))

    return JSONResponse({
        "valid": True,
        "credits_remaining": credits,
        "rate_limit": data.get("rate_limit", None),
    })


# ──────────────────────────── GET /models ──────────────────────────────────────

@router.get("/models")
async def get_openrouter_models(
    x_openrouter_key: Annotated[Optional[str], Header()] = None,
) -> JSONResponse:
    """
    Return available cloud models (FR-42).
    Tries to fetch live list from OpenRouter; falls back to static list on failure.
    """
    # If no key, return only the local model option
    if not x_openrouter_key:
        return JSONResponse({
            "models": [get_static_models()[0]],  # Local model only
            "source": "static_no_key",
        })

    headers = {
        "Authorization": f"Bearer {x_openrouter_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(OPENROUTER_MODELS_ENDPOINT, headers=headers)

        if resp.status_code == 200:
            raw_models = resp.json().get("data", [])
            # Normalise to our schema
            models_list = [
                {
                    "id": m.get("id", ""),
                    "name": m.get("name", m.get("id", "")),
                    "cost_per_1k_tokens": _extract_cost(m),
                    "context_window": m.get("context_length", 4096),
                }
                for m in raw_models
                if m.get("id")
            ]
            # Prepend local model
            local_model = get_static_models()[0]
            return JSONResponse({"models": [local_model] + models_list, "source": "openrouter_live"})

    except (httpx.TimeoutException, httpx.RequestError) as exc:
        logger.warning("Live model fetch failed (%s) — using static fallback", exc)

    logger.warning("Could not fetch live model list — using static fallback")
    return JSONResponse({
        "models": get_static_models(),
        "source": "static_fallback",
    })


def _extract_cost(model_data: dict) -> float:
    """Extract blended cost per 1k tokens from OpenRouter model metadata."""
    try:
        pricing = model_data.get("pricing", {})
        prompt_cost = float(pricing.get("prompt", 0))
        completion_cost = float(pricing.get("completion", 0))
        return round((prompt_cost + completion_cost) / 2 * 1000, 6)
    except (TypeError, ValueError):
        return 0.0
