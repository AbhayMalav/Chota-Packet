"""
routes.py - All FastAPI route handlers for Chota Packet (FR-03, FR-04, FR-06, FR-13, FR-38, FR-41, FR-42).

Endpoints:
  GET  /         - Root probe
  GET  /health   - FR-13, FR-38, FR-19
  POST /stt      - FR-04, FR-15
  POST /enhance  - FR-06, FR-21, FR-24, FR-27, FR-29, FR-30, FR-42
  POST /validate-key - FR-41
  GET  /models   - FR-42
"""

from __future__ import annotations
from fastapi.responses import HTMLResponse
import json
import logging
import re
from typing import Annotated, Literal, Optional

import httpx
from fastapi import APIRouter, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

from config import (
    ALLOWED_AUDIO_MIMES,
    CLOUD_MAX_OUTPUT_TOKENS,
    MAX_AUDIO_SIZE_BYTES,
    MAX_INPUT_CHARS,
    OPENROUTER_AUTH_ENDPOINT,
    OPENROUTER_CHAT_ENDPOINT,
    OPENROUTER_COST_PER_TOKEN,
    OPENROUTER_MODELS_ENDPOINT,
    OPENROUTER_TIMEOUT_S,
    STYLE_MAP,
    TONE_MAP,
    VALIDATE_KEY_TIMEOUT_S,
)
from enhancement_prompts import ENHANCEMENT_SYSTEM_PROMPTS
from models import build_prefix, run_local_enhance, run_stt
from openrouter_models import PINNED_TOP_IDS, get_static_models

logger = logging.getLogger(__name__)
router = APIRouter()


# ──────────────────────────── GET / ──────────────────────────────────────────


@router.get("/")
async def root() -> JSONResponse:
    """
    Root probe endpoint.
    Render's health checker and browser tab hits land here.
    Returns a minimal OK payload — never 404.
    """
    return JSONResponse({
        "service": "Chota Packet API",
        "version": "2.0.0",
        "status": "ok",
        "docs": "/docs",
    })


# ──────────────────────────── Pydantic models ─────────────────────────────────


class EnhanceRequest(BaseModel):
    """Full /enhance request body. All parameters optional with safe defaults."""

    text: str = Field(..., min_length=1, max_length=MAX_INPUT_CHARS)
    input_lang: Literal["hi", "en"] = "en"
    output_lang: Literal["hi", "en", "auto"] = "auto"
    style: str = "general"
    tone: Literal["formal", "casual", "technical", ""] = ""
    enhancement_level: Literal[
        "basic",
        "detailed",
        "chain_of_thought",
        "meta",
        "prompt_chaining",
        "multi_prompt_fusion",
        "soft_prompting",
        "advanced",
    ] = "basic"
    variant_mode: bool = False
    inference_mode: Literal["local", "cloud"] = "local"
    model: Optional[str] = None

    @field_validator("style")
    @classmethod
    def validate_style(cls, v: str) -> str:
        if v not in STYLE_MAP:
            logger.warning(
                "[EnhanceRequest] Unknown style '%s' - falling back to 'general'", v
            )
            return "general"
        return v

    @field_validator("enhancement_level")
    @classmethod
    def validate_level(cls, v: str) -> str:
        if v not in ENHANCEMENT_SYSTEM_PROMPTS:
            logger.warning(
                "[EnhanceRequest] Unknown enhancement_level '%s' - falling back to 'basic'", v
            )
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

@router.get("/health/ui", response_class=HTMLResponse, include_in_schema=False)
async def health_ui() -> HTMLResponse:
    """
    Human-readable health dashboard. Polls /health every 5s.
    Not included in OpenAPI schema — ops tool only.
    """
    html = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Chota Packet — Backend Health</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #0d0d0d;
      color: #e5e5e5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 24px;
    }

    header {
      text-align: center;
      margin-bottom: 40px;
    }
    header h1 {
      font-size: 1.6rem;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #fff;
    }
    header p {
      font-size: 0.82rem;
      color: #666;
      margin-top: 6px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-top: 16px;
    }
    .badge.ok    { background: #0d2e1a; color: #34d399; border: 1px solid #064e2e; }
    .badge.error { background: #2e0d0d; color: #f87171; border: 1px solid #7f1d1d; }
    .badge.loading { background: #1a1a2e; color: #a78bfa; border: 1px solid #3b3b7f; }
    .dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: currentColor;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.3; }
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      width: 100%;
      max-width: 860px;
      margin-top: 32px;
    }

    .card {
      background: #161616;
      border: 1px solid #262626;
      border-radius: 12px;
      padding: 20px 24px;
      transition: border-color 0.2s;
    }
    .card:hover { border-color: #3a3a3a; }
    .card-label {
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #555;
      margin-bottom: 10px;
    }
    .card-value {
      font-size: 1.35rem;
      font-weight: 700;
      color: #fff;
    }
    .card-value.green  { color: #34d399; }
    .card-value.red    { color: #f87171; }
    .card-value.yellow { color: #fbbf24; }
    .card-value.purple { color: #a78bfa; }
    .card-sub {
      font-size: 0.75rem;
      color: #555;
      margin-top: 6px;
    }

    .detail-box {
      width: 100%;
      max-width: 860px;
      margin-top: 16px;
      background: #161616;
      border: 1px solid #262626;
      border-radius: 12px;
      padding: 16px 24px;
      font-size: 0.8rem;
      color: #ef4444;
      display: none;
    }
    .detail-box.visible { display: block; }
    .detail-box strong { color: #f87171; }

    .refresh-row {
      margin-top: 32px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.78rem;
      color: #444;
    }
    .refresh-row span#last-updated { color: #555; }

    footer {
      margin-top: 48px;
      font-size: 0.72rem;
      color: #333;
      text-align: center;
      line-height: 1.8;
    }
    footer a { color: #4b5563; text-decoration: none; }
    footer a:hover { color: #9ca3af; }
  </style>
</head>
<body>

<header>
  <h1>⚡ Chota Packet Backend</h1>
  <p>Live health dashboard · refreshes every 5 seconds</p>
  <div id="overall-badge" class="badge loading">
    <span class="dot"></span>
    <span>Checking...</span>
  </div>
</header>

<div class="grid">
  <div class="card">
    <div class="card-label">Models Loaded</div>
    <div class="card-value" id="val-models">—</div>
    <div class="card-sub" id="sub-models">—</div>
  </div>
  <div class="card">
    <div class="card-label">Inference Mode</div>
    <div class="card-value" id="val-mode">—</div>
    <div class="card-sub" id="sub-mode">—</div>
  </div>
  <div class="card">
    <div class="card-label">ffmpeg</div>
    <div class="card-value" id="val-ffmpeg">—</div>
    <div class="card-sub" id="sub-ffmpeg">—</div>
  </div>
  <div class="card">
    <div class="card-label">Last Response</div>
    <div class="card-value green" id="val-latency">—</div>
    <div class="card-sub">health endpoint round-trip</div>
  </div>
  <div class="card">
    <div class="card-label">Uptime (this tab)</div>
    <div class="card-value purple" id="val-uptime">0s</div>
    <div class="card-sub">since page opened</div>
  </div>
  <div class="card">
    <div class="card-label">Poll Count</div>
    <div class="card-value" id="val-polls" style="color:#a78bfa">0</div>
    <div class="card-sub" id="sub-polls">0 errors</div>
  </div>
</div>

<div class="detail-box" id="error-box">
  <strong>Load Error:</strong> <span id="error-detail"></span>
</div>

<div class="refresh-row">
  <span>Last updated: <span id="last-updated">never</span></span>
  ·
  <span><a href="/health" target="_blank">Raw JSON</a></span>
  ·
  <span><a href="/docs" target="_blank">Swagger Docs</a></span>
</div>

<footer>
  Chota Packet API v2.0.0 · <a href="/redoc" target="_blank">ReDoc</a>
</footer>

<script>
  const startTime = Date.now();
  let pollCount = 0;
  let errorCount = 0;

  function fmtUptime(ms) {
    const s = Math.floor(ms / 1000);
    if (s < 60)  return s + "s";
    if (s < 3600) return Math.floor(s/60) + "m " + (s%60) + "s";
    return Math.floor(s/3600) + "h " + Math.floor((s%3600)/60) + "m";
  }

  function setCard(id, value, cls, sub) {
    const el = document.getElementById("val-" + id);
    el.textContent = value;
    el.className = "card-value " + (cls || "");
    if (sub !== undefined)
      document.getElementById("sub-" + id).textContent = sub;
  }

  async function poll() {
    const t0 = performance.now();
    try {
      const res = await fetch("/health");
      const latency = Math.round(performance.now() - t0);
      const data = await res.json();
      pollCount++;

      // Overall badge
      const badge = document.getElementById("overall-badge");
      if (data.status === "ok") {
        badge.className = "badge ok";
        badge.innerHTML = '<span class="dot"></span> All Systems Operational';
      } else {
        badge.className = "badge error";
        badge.innerHTML = '<span class="dot"></span> Degraded';
      }

      // Models card
      if (data.models_loaded) {
        setCard("models", "Loaded", "green", "ready for inference");
      } else {
        setCard("models", "Failed", "red", "check logs");
      }

      // Inference mode card
      if (data.mock_mode) {
        setCard("mode", "Mock", "yellow", "no real weights found");
      } else {
        setCard("mode", "Real", "green", "mT5 + Whisper active");
      }

      // ffmpeg card
      if (data.ffmpeg_available) {
        setCard("ffmpeg", "Available", "green", "audio transcription enabled");
      } else {
        setCard("ffmpeg", "Missing", "red", "STT unavailable");
      }

      // Latency card
      const latCls = latency < 100 ? "green" : latency < 300 ? "yellow" : "red";
      setCard("latency", latency + "ms", latCls);

      // Poll count card
      document.getElementById("val-polls").textContent = pollCount;
      document.getElementById("sub-polls").textContent = errorCount + " errors";

      // Error detail box
      const box = document.getElementById("error-box");
      if (data.detail) {
        document.getElementById("error-detail").textContent = data.detail;
        box.classList.add("visible");
      } else {
        box.classList.remove("visible");
      }

      document.getElementById("last-updated").textContent =
        new Date().toLocaleTimeString();

    } catch (err) {
      errorCount++;
      pollCount++;
      const badge = document.getElementById("overall-badge");
      badge.className = "badge error";
      badge.innerHTML = '<span class="dot"></span> Unreachable';
      setCard("latency", "—", "red");
      document.getElementById("val-polls").textContent = pollCount;
      document.getElementById("sub-polls").textContent = errorCount + " errors";
    }
  }

  // Update uptime counter every second
  setInterval(() => {
    document.getElementById("val-uptime").textContent =
      fmtUptime(Date.now() - startTime);
  }, 1000);

  // Poll health every 5 seconds
  poll();
  setInterval(poll, 5000);
</script>
</body>
</html>
"""
    return HTMLResponse(content=html)

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
                "detail": f"File exceeds {MAX_AUDIO_SIZE_BYTES // (1024 * 1024)} MB limit.",
            },
        )

    # Guard: magic bytes check for audio files
    header = audio_bytes[:12]
    is_valid_audio = (
        header.startswith(b"\x1A\x45\xDF\xA3")  # WebM
        or header.startswith(b"OggS")  # Ogg
        or (header.startswith(b"RIFF") and header[8:12] == b"WAVE")  # WAV
        or header.startswith(b"ID3")  # MP3 with ID3 tag
        or header.startswith(b"\xFF\xFB")  # MP3
        or header.startswith(b"\xFF\xF3")  # MP3
        or header.startswith(b"\xFF\xFA")  # MP3
    )
    if not is_valid_audio:
        logger.warning(
            "[POST /stt] Rejected upload: unrecognised magic bytes %r (filename=%s)",
            header,
            audio.filename,
        )
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

    # Guard: language value — coerce unknown values to 'en' with a warning
    if lang not in ("hi", "en"):
        logger.warning(
            "[POST /stt] Unrecognised lang='%s' - coercing to 'en'", lang
        )
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
        logger.warning(
            "[POST /stt] Transcription ValueError (lang=%s, size=%d bytes): %s",
            lang,
            len(audio_bytes),
            exc,
        )
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Transcription failed",
                "detail": "Audio processing failed. Please ensure the file is a valid audio format.",
            },
        )
    except Exception as exc:
        logger.exception(
            "[POST /stt] Unexpected error during transcription (lang=%s, size=%d bytes): %s",
            lang,
            len(audio_bytes),
            exc,
        )
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Transcription failed",
                "detail": "An internal server error occurred during transcription.",
            },
        )

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
    Prompt enhancement - local mT5 or cloud OpenRouter path (FR-06, FR-27–FR-30, FR-42).
    """
    models = request.app.state.models
    if not models.loaded:
        raise HTTPException(
            status_code=503,
            detail="Models not loaded. Check server logs.",
        )

    # Truncate if over limit (FR-01)
    text = req.text[:MAX_INPUT_CHARS]

    system_prompt = ENHANCEMENT_SYSTEM_PROMPTS.get(
        req.enhancement_level, ENHANCEMENT_SYSTEM_PROMPTS["basic"]
    )
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
        referer = request.headers.get("referer") or str(request.base_url)
        return await _cloud_enhance(req, text, prefix, system_prompt, x_openrouter_key, referer)

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
        logger.warning(
            "[POST /enhance] ValueError during local enhancement "
            "(level=%s, style=%s, lang=%s, text_len=%d): %s",
            req.enhancement_level,
            req.style,
            req.input_lang,
            len(text),
            exc,
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Enhancement failed. Please rephrase your input and try again."},
        )
    except Exception as exc:
        logger.exception(
            "[POST /enhance] Unexpected error during local enhancement "
            "(level=%s, style=%s, lang=%s, text_len=%d): %s",
            req.enhancement_level,
            req.style,
            req.input_lang,
            len(text),
            exc,
        )
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
    referer: str,
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
        "HTTP-Referer": referer,  # Required by OpenRouter
        "X-Title": "Chota Packet",
    }

    try:
        async with httpx.AsyncClient(timeout=OPENROUTER_TIMEOUT_S) as client:
            resp = await client.post(OPENROUTER_CHAT_ENDPOINT, json=payload, headers=headers)
    except httpx.TimeoutException:
        logger.warning(
            "[_cloud_enhance] Request timed out (model=%s, text_len=%d, timeout=%ss)",
            req.model,
            len(text),
            OPENROUTER_TIMEOUT_S,
        )
        raise HTTPException(
            status_code=504,
            detail={"error": "Cloud model request timed out. Try again or switch to the local model."},
        )
    except httpx.RequestError as exc:
        logger.error(
            "[_cloud_enhance] Network error reaching OpenRouter (model=%s): %s",
            req.model,
            exc,
        )
        raise HTTPException(
            status_code=503,
            detail={"error": "OpenRouter is temporarily unavailable. The local model is still available."},
        )

    # Map OpenRouter HTTP errors (FR-42 edge cases)
    if resp.status_code == 401:
        raise HTTPException(
            status_code=401,
            detail={
                "error": "Invalid or expired OpenRouter API key.",
                "detail": "Please update it in Settings.",
            },
        )
    if resp.status_code == 402:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "Insufficient OpenRouter credits.",
                "detail": "Add credits at openrouter.ai or switch to the local model.",
            },
        )
    if resp.status_code == 429:
        retry_after = resp.headers.get("retry-after", "unknown")
        raise HTTPException(
            status_code=429,
            detail={"error": "Rate limited by OpenRouter.", "retry_after": retry_after},
        )
    if resp.status_code >= 500:
        logger.warning(
            "[_cloud_enhance] OpenRouter returned server error %d (model=%s)",
            resp.status_code,
            req.model,
        )
        raise HTTPException(
            status_code=503,
            detail={"error": "OpenRouter is temporarily unavailable. The local model is still available."},
        )

    # Parse response — guard against unexpected shape or non-JSON body
    try:
        data = resp.json()
        content = data["choices"][0]["message"]["content"].strip()
        if not content:
            raise ValueError("Empty content field in OpenRouter response")
    except (json.JSONDecodeError, KeyError, IndexError, ValueError) as exc:
        logger.error(
            "[_cloud_enhance] Failed to parse OpenRouter response "
            "(model=%s, status=%d, error=%s, raw_body=%.500s)",
            req.model,
            resp.status_code,
            exc,
            resp.text,
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Enhancement failed. Please rephrase your input and try again."},
        )

    # Cost estimate from usage field if present.
    # Blended average = (prompt_cost + completion_cost) / 2 per token.
    usage = data.get("usage", {})
    total_tokens = usage.get("total_tokens", 0)
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
        logger.warning("[POST /validate-key] OpenRouter auth endpoint timed out")
        raise HTTPException(
            status_code=408,
            detail={"error": "Validation timed out. Check internet connection."},
        )
    except httpx.RequestError as exc:
        logger.error("[POST /validate-key] Network error reaching OpenRouter: %s", exc)
        raise HTTPException(
            status_code=502,
            detail={"error": "Could not reach OpenRouter. Try again later."},
        )

    if resp.status_code == 401:
        return JSONResponse({"valid": False, "reason": "Invalid or revoked API key."})

    if resp.status_code != 200:
        logger.warning(
            "[POST /validate-key] Unexpected status from OpenRouter auth endpoint: %d",
            resp.status_code,
        )
        raise HTTPException(
            status_code=502,
            detail={"error": "Could not validate key - unknown OpenRouter response."},
        )

    # Parse once — guard against malformed JSON body
    try:
        body = resp.json()
    except json.JSONDecodeError as exc:
        logger.error(
            "[POST /validate-key] Could not decode OpenRouter auth response: %s (raw=%.200s)",
            exc,
            resp.text,
        )
        raise HTTPException(
            status_code=502,
            detail={"error": "Could not validate key - unreadable OpenRouter response."},
        )

    data = body.get("data", body)
    credits = data.get("limit_remaining", data.get("usage", {}).get("credits", None))

    return JSONResponse({
        "valid": True,
        "credits_remaining": credits,
        "rate_limit": data.get("rate_limit", None),
    })


# ──────────────────────────── GET /models ────────────────────────────────────


@router.get("/models")
async def get_openrouter_models(
    x_openrouter_key: Annotated[Optional[str], Header()] = None,
) -> JSONResponse:
    """
    Return available cloud models (FR-42).

    Sort order (always enforced):
      1. Local model       — free, offline, always first
      2. Auto Router       — OpenRouter smart routing, always second
      3. Free cloud models — cost == 0, sorted alphabetically
      4. Paid models       — ascending blended cost, then alphabetically

    Tries to fetch live list from OpenRouter when a key is present;
    falls back to static list on any failure.
    Without a key, returns only the two pinned models (local + auto router).
    """
    if not x_openrouter_key:
        # Return pinned models only — no key means no cloud access anyway
        pinned = [m for m in get_static_models() if m["id"] in PINNED_TOP_IDS]
        return JSONResponse({"models": pinned, "source": "static_no_key"})

    headers = {
        "Authorization": f"Bearer {x_openrouter_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=OPENROUTER_TIMEOUT_S) as client:
            resp = await client.get(OPENROUTER_MODELS_ENDPOINT, headers=headers)

        if resp.status_code == 200:
            try:
                raw_models = resp.json().get("data", [])
            except json.JSONDecodeError as exc:
                logger.warning(
                    "[GET /models] Could not decode live model list response: %s", exc
                )
                raw_models = []

            # Normalise to our schema, skip entries without an id
            live_models: list[dict] = [
    {
        "id": m.get("id", ""),
        "name": m.get("name", m.get("id", "")),
        "cost_per_1k_tokens": _extract_cost(m),
        "context_window": m.get("context_length", 4096),
    }
    for m in raw_models
    if m.get("id")
    and not m.get("expiration_date")          # skip deprecated models
    and "text" in (m.get("architecture", {})  # skip non-text models (image-gen, etc.)
                    .get("output_modalities", ["text"]))
]

            live_models.sort(key=_sort_key)

            # Prepend pinned static models (local + auto router) so they are
            # always present even if OpenRouter's live list omits them.
            pinned = [m for m in get_static_models() if m["id"] in PINNED_TOP_IDS]
            live_ids = {m["id"] for m in live_models}
            deduped_pinned = [m for m in pinned if m["id"] not in live_ids]

            return JSONResponse({
                "models": deduped_pinned + live_models,
                "source": "openrouter_live",
            })

        # Non-200 from OpenRouter — log it and fall through to static fallback
        logger.warning(
            "[GET /models] Live fetch returned non-200 status %d - using static fallback",
            resp.status_code,
        )

    except httpx.TimeoutException as exc:
        logger.warning(
            "[GET /models] Live model fetch timed out (%s) - using static fallback", exc
        )
    except httpx.RequestError as exc:
        logger.warning(
            "[GET /models] Network error fetching live models (%s) - using static fallback", exc
        )

    return JSONResponse({"models": get_static_models(), "source": "static_fallback"})


# ──────────────────────────── Helpers ────────────────────────────────────────


def _sort_key(m: dict) -> tuple:
    """
    Sort key that enforces the canonical model display order:
      (0) Pinned IDs in declared PINNED_TOP_IDS order  — local, auto router
      (1) Free cloud models (cost == 0), alphabetically
      (2) Paid models, ascending cost then alphabetically
    """
    model_id = m.get("id", "")
    if model_id in PINNED_TOP_IDS:
        return (0, PINNED_TOP_IDS.index(model_id), 0.0, "")
    if m.get("cost_per_1k_tokens", 0.0) == 0.0:
        return (1, 0, 0.0, m.get("name", ""))
    return (2, 0, m.get("cost_per_1k_tokens", 0.0), m.get("name", ""))


def _extract_cost(model_data: dict) -> float:
    """
    Extract blended cost per 1k tokens from OpenRouter model metadata.

    OpenRouter exposes separate prompt and completion costs per token.
    We average them as a single display figure for UI cost estimates.
    """
    try:
        pricing = model_data.get("pricing", {})
        prompt_cost = float(pricing.get("prompt", 0))
        completion_cost = float(pricing.get("completion", 0))
        # Average prompt + completion cost, scaled to per-1k-token display unit
        return round((prompt_cost + completion_cost) / 2 * 1000, 6)
    except (TypeError, ValueError):
        return 0.0