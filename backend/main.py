from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import ALLOWED_ORIGINS
from enhancement_prompts import validate_enhancement_prompts
from models import ModelState, check_ffmpeg, load_models
from routes import router

# ─────────────────────────── Logging setup ────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

_SEPARATOR = "=" * 60


# ─────────────────────────── Helpers ─────────────────────────────────────────


def _make_error_state(error_msg: str) -> ModelState:
    """Return a ModelState that signals a failed / unloaded backend."""
    state = ModelState()
    state.loaded = False
    state.load_error = error_msg
    return state


# ─────────────────────────── Lifespan ────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Server startup / shutdown lifecycle (FR-09, FR-19, FR-27, FR-38).

    On startup:
      1. ffmpeg availability check
      2. Enhancement prompt validation
      3. Model loading (real or mock)
    On shutdown:
      Logs clean shutdown (models are GC'd automatically).
    """
    logger.info(_SEPARATOR)
    logger.info("  Chota Packet Backend - Starting Up")
    logger.info(_SEPARATOR)

    # Pre-initialise app.state.models to a safe default so that any route
    # accessing it before or after a failed startup never hits AttributeError.
    app.state.models = _make_error_state("Startup incomplete")

    # ── 1. ffmpeg check (FR-38) ───────────────────────────────────────────────
    ffmpeg_ok = check_ffmpeg()
    app.state.ffmpeg_available = ffmpeg_ok
    if not ffmpeg_ok:
        logger.warning(
            "[lifespan] ffmpeg not found on PATH. "
            "Audio/video transcription features will be unavailable. "
            "Install ffmpeg and restart to enable."
        )

    # ── 2. Validate enhancement system prompts (FR-27) ───────────────────────
    missing = validate_enhancement_prompts()
    if missing:
        error_msg = f"Missing enhancement prompts for levels: {missing}"
        logger.error(
            "[lifespan] FATAL: Enhancement system prompts missing for levels: %s. "
            "Check enhancement_prompts.py. Server will start in degraded mode.",
            missing,
        )
        app.state.models = _make_error_state(error_msg)

    else:
        # ── 3. Load ML models (FR-09, FR-19) ─────────────────────────────────
        try:
            state = load_models()
            app.state.models = state
            if state.mock_mode:
                logger.info(
                    "[lifespan] Running in MOCK MODE - real model weights not found. "
                    "Drop LoRA adapter in backend/models/mt5_lora_merged/ and restart."
                )
            else:
                logger.info("[lifespan] Real inference mode - both models loaded successfully.")
        except RuntimeError as exc:
            logger.error(
                "[lifespan] Model loading failed (RuntimeError): %s",
                exc,
                exc_info=True,
            )
            app.state.models = _make_error_state(str(exc))
        except Exception as exc:
            # Catches ImportError, OSError, MemoryError, torch errors, etc.
            # Without this, the exception escapes the lifespan, the server
            # crashes, and app.state.models is never set — causing AttributeError
            # on every subsequent request.
            logger.error(
                "[lifespan] Unexpected error during model loading: %s",
                exc,
                exc_info=True,
            )
            app.state.models = _make_error_state(
                f"Unexpected model load failure: {type(exc).__name__}: {exc}"
            )

    # ── Startup summary ───────────────────────────────────────────────────────
    models_state: ModelState = app.state.models
    if models_state.loaded:
        status_line = "STATUS: OK" + (" (mock mode)" if models_state.mock_mode else "")
    else:
        status_line = f"STATUS: DEGRADED — {models_state.load_error}"

    logger.info(_SEPARATOR)
    logger.info("  Startup complete.")
    logger.info("  ffmpeg: %s", "available" if ffmpeg_ok else "NOT FOUND")
    logger.info("  Models: %s", status_line)
    logger.info("  Health : http://localhost:8000/health")
    logger.info("  Docs   : http://localhost:8000/docs")
    logger.info(_SEPARATOR)

    yield  # ← application runs here

    logger.info("[lifespan] Chota Packet Backend - Shutting down cleanly.")


# ─────────────────────────── FastAPI app ─────────────────────────────────────


app = FastAPI(
    title="Chota Packet API",
    description=(
        "On-device AI Prompt Enhancement Assistant. "
        "Transforms rough text/voice into structured LLM prompts using mT5-small + LoRA."
    ),
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware — allow_methods="*" ensures OPTIONS preflight is handled
# automatically by Starlette for all routes (NF-S1, A6).
# allow_credentials MUST be False when allow_origins contains wildcards;
# browsers block credentialed requests to wildcard origins per the CORS spec.
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["Content-Type", "X-OpenRouter-Key"],
)

# Mount all route handlers
app.include_router(router)