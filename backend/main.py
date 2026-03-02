"""
main.py — Chota Packet FastAPI application entry point.

Responsibilities:
  - Define the FastAPI app with CORS configured for localhost:3000 only (NF-S1, A6)
  - Lifespan context manager that:
      1. Checks ffmpeg availability (FR-38)
      2. Validates enhancement prompts (FR-27)
      3. Loads ML models (FR-09) — dual-mode (real / mock stub)
      4. Sets app.state flags for health endpoint
  - Include all routers from routes.py
  - Structured logging

Usage:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

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


# ─────────────────────────── Lifespan ────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Server startup / shutdown lifecycle (FR-09, FR-19, FR-27, FR-38).

    On startup:
      1. ffmpeg check
      2. Enhancement prompt validation
      3. Model loading (real or mock)
    On shutdown:
      (No cleanup needed — models are GC'd automatically)
    """
    logger.info("=" * 60)
    logger.info("  Chota Packet Backend — Starting Up")
    logger.info("=" * 60)

    # 1. ffmpeg check (FR-38)
    ffmpeg_ok = check_ffmpeg()
    app.state.ffmpeg_available = ffmpeg_ok

    # 2. Validate enhancement system prompts (FR-27)
    missing = validate_enhancement_prompts()
    if missing:
        logger.error(
            "FATAL: Enhancement system prompts missing for levels: %s. "
            "Check enhancement_prompts.py.",
            missing,
        )
        # Mark models as not loaded so /health reports the issue
        state = ModelState()
        state.loaded = False
        state.load_error = f"Missing enhancement prompts for: {missing}"
        app.state.models = state
    else:
        # 3. Load ML models (FR-09, FR-19)
        try:
            state = load_models()
            app.state.models = state
            if state.mock_mode:
                logger.info(
                    "🟡 Running in MOCK MODE — real model weights not found.\n"
                    "   Drop LoRA adapter in backend/models/mt5_lora_merged/ and restart."
                )
            else:
                logger.info("🟢 Real inference mode — both models loaded.")
        except RuntimeError as exc:
            logger.error("❌ Model loading failed: %s", exc)
            state = ModelState()
            state.loaded = False
            state.load_error = str(exc)
            app.state.models = state

    logger.info("=" * 60)
    logger.info("  Startup complete. Backend ready at http://localhost:8000")
    logger.info(
        "  Health: http://localhost:8000/health | Docs: http://localhost:8000/docs"
    )
    logger.info("=" * 60)

    yield  # ← application runs here

    logger.info("Chota Packet Backend — Shutting down.")


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

# CORS — only allow localhost:3000 (NF-S1, A6)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-OpenRouter-Key"],
)

# Mount all route handlers
app.include_router(router)
