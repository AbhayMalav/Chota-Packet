"""
models.py — Model loading, inference, and post-processing for Chota Packet.

Architecture:
  - Dual-mode: if backend/models/mt5_lora_merged/ exists  →  real mT5 + Whisper inference
               otherwise                                   →  mock stub mode (dev/CI friendly)
  - When real weights are ready, drop them in and restart — no code change needed.
  - float32 is used unconditionally on CPU (R-02: float16 crashes on CPU).
"""

from __future__ import annotations

import os
import io
import re
import logging
import subprocess
from collections import Counter
from dataclasses import dataclass, field
from typing import Optional

import numpy as np

from config import (
    MT5_MODEL_DIR,
    WHISPER_MODEL_ID,
    TARGET_SAMPLE_RATE,
    MAX_NEW_TOKENS,
    NUM_BEAMS,
    VARIANT_TEMPERATURE,
    HALLUCINATION_MIN_TOKENS,
    HALLUCINATION_NGRAM,
    HALLUCINATION_MAX_REPEATS,
    TASK_PREFIXES,
    STYLE_MAP,
    TONE_MAP,
    DEVANAGARI_START,
    DEVANAGARI_END,
)

logger = logging.getLogger(__name__)


# ─────────────────────────── State container ──────────────────────────────────

@dataclass
class ModelState:
    """Holds all loaded model objects. Stored in app.state.models."""

    mock_mode: bool = True                  # True until real weights are found

    # Real model objects (populated only in production mode)
    whisper_processor: object = field(default=None, repr=False)
    whisper_model: object = field(default=None, repr=False)
    mt5_tokenizer: object = field(default=None, repr=False)
    mt5_model: object = field(default=None, repr=False)

    loaded: bool = False
    load_error: Optional[str] = None


# ─────────────────────────── Model loading ────────────────────────────────────

def load_models() -> ModelState:
    """
    Load mT5-small (with LoRA adapter) and Whisper Tiny into memory.

    Strategy:
      - If MT5_MODEL_DIR exists → real inference mode
      - Otherwise              → mock mode (all endpoints still work)

    Returns:
        ModelState with .loaded = True on success.
    Raises:
        RuntimeError if real model directory exists but loading fails.
    """
    state = ModelState()

    real_model_exists = os.path.isdir(MT5_MODEL_DIR)

    if not real_model_exists:
        logger.warning(
            "⚡ MOCK MODE: '%s' not found. Using stub inference. "
            "Drop trained LoRA weights there and restart for real inference.",
            MT5_MODEL_DIR,
        )
        state.mock_mode = True
        state.loaded = True
        return state

    # ── Real model loading ───────────────────────────────────────────────────
    logger.info("Loading real models from %s ...", MT5_MODEL_DIR)
    try:
        import torch
        from transformers import (
            MT5ForConditionalGeneration,
            T5Tokenizer,
            WhisperProcessor,
            WhisperForConditionalGeneration,
        )

        # Whisper Tiny — HuggingFace Hub (cached after first download)
        logger.info("  Loading Whisper Tiny ...")
        state.whisper_processor = WhisperProcessor.from_pretrained(WHISPER_MODEL_ID)
        state.whisper_model = WhisperForConditionalGeneration.from_pretrained(
            WHISPER_MODEL_ID,
            torch_dtype=torch.float32,   # float16 crashes on CPU (R-02)
        )
        state.whisper_model.eval()

        # mT5-small + merged LoRA adapter
        logger.info("  Loading mT5-small + LoRA adapter from %s ...", MT5_MODEL_DIR)
        state.mt5_tokenizer = T5Tokenizer.from_pretrained(MT5_MODEL_DIR)
        state.mt5_model = MT5ForConditionalGeneration.from_pretrained(
            MT5_MODEL_DIR,
            torch_dtype=torch.float32,
        )
        state.mt5_model.eval()

        state.mock_mode = False
        state.loaded = True
        logger.info("✅ Models loaded successfully (real inference mode).")

    except Exception as exc:
        error_msg = f"Model loading failed: {exc}"
        logger.error(error_msg)
        state.load_error = error_msg
        state.loaded = False
        raise RuntimeError(error_msg) from exc

    return state


# ─────────────────────────── ffmpeg check ─────────────────────────────────────

def check_ffmpeg() -> bool:
    """
    Verify ffmpeg is available on PATH (FR-38).

    Returns:
        True if ffmpeg is callable, False otherwise.
    """
    try:
        result = subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True,
            timeout=5,
        )
        available = result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        available = False

    if not available:
        logger.warning(
            "⚠️  ffmpeg not found on PATH. "
            "Audio conversion will fail. "
            "Install ffmpeg: https://ffmpeg.org/download.html"
        )
    return available


# ─────────────────────────── Prefix builder ───────────────────────────────────

def build_prefix(
    input_lang: str,
    style: str,
    tone: str,
    enhancement_level: str,
    output_lang: str = "auto",
) -> str:
    """
    Compose the full task prefix string for mT5 tokenization (FR-06, FR-21, FR-24, FR-27, FR-30).

    Examples:
        build_prefix("en", "code", "formal", "advanced")
        → "enhance prompt [code] [formal] [advanced]: "

        build_prefix("hi", "general", "", "basic")
        → "prompt sudharo: "

        build_prefix("hi", "general", "", "basic", output_lang="en")
        → "prompt sudharo (output: English): "
    """
    base = TASK_PREFIXES.get(input_lang, TASK_PREFIXES["en"])

    tags: list[str] = []

    style_tag = STYLE_MAP.get(style, "")
    if style_tag:
        tags.append(f"[{style_tag}]")

    tone_tag = TONE_MAP.get(tone, "")
    if tone_tag:
        tags.append(f"[{tone_tag}]")

    if enhancement_level and enhancement_level != "basic":
        tags.append(f"[{enhancement_level}]")

    # Cross-lingual modifier (FR-30)
    cross_lingual_tag = ""
    if output_lang not in ("auto", input_lang):
        target_name = "English" if output_lang == "en" else "Hindi"
        cross_lingual_tag = f" (output: {target_name})"

    tag_str = (" " + " ".join(tags)) if tags else ""
    return f"{base}{tag_str}{cross_lingual_tag}: "


# ─────────────────────────── Hallucination check ──────────────────────────────

def check_hallucination(tokens: list[str]) -> bool:
    """
    Detect too-short or repetitive output (FR-16).

    Args:
        tokens: List of decoded word tokens (after stripping special tokens).
    Returns:
        True if the output is hallucinated/unreliable and should be rejected.
    """
    if len(tokens) < HALLUCINATION_MIN_TOKENS:
        logger.debug("Hallucination: output too short (%d tokens)", len(tokens))
        return True

    # N-gram repetition check
    ngrams = [
        tuple(tokens[i : i + HALLUCINATION_NGRAM])
        for i in range(len(tokens) - HALLUCINATION_NGRAM + 1)
    ]
    counts = Counter(ngrams)
    if counts and counts.most_common(1)[0][1] > HALLUCINATION_MAX_REPEATS:
        logger.debug(
            "Hallucination: n-gram '%s' repeated %d times",
            counts.most_common(1)[0][0],
            counts.most_common(1)[0][1],
        )
        return True

    return False


# ─────────────────────────── Script normalization ─────────────────────────────

def normalize_script(text: str) -> tuple[str, str]:
    """
    Detect whether text is Devanagari, Roman-script Hindi (Hinglish), or English (FR-04 §5).

    Returns:
        (cleaned_text, detected_script) where detected_script is "devanagari" | "roman" | "en"
    """
    cleaned = text.strip()
    devanagari_chars = sum(
        1 for ch in cleaned if DEVANAGARI_START <= ord(ch) <= DEVANAGARI_END
    )
    ratio = devanagari_chars / max(len(cleaned), 1)

    if ratio > 0.3:
        return cleaned, "devanagari"
    elif re.search(r"\b(mera|meri|aap|karo|karna|hai|hain|ke liye|ke|ka|ki)\b", cleaned, re.I):
        return cleaned, "roman"  # Hinglish detected
    else:
        return cleaned, "en"


# ─────────────────────────── Local enhance inference ──────────────────────────

def run_local_enhance(
    text: str,
    prefix: str,
    system_prompt: str,
    variant_mode: bool = False,
    mt5_tokenizer=None,
    mt5_model=None,
    mock_mode: bool = False,
) -> str:
    """
    Run mT5 prompt enhancement (FR-06).

    In mock mode returns a deterministic placeholder so all endpoints can be
    tested without trained weights.

    Args:
        text:          Raw user input string.
        prefix:        Composed prefix from build_prefix().
        system_prompt: Text of the system-level enhancement instruction.
        variant_mode:  If True, use sampling instead of beam search (FR-29).
        mt5_tokenizer: Loaded T5Tokenizer (None in mock mode).
        mt5_model:     Loaded MT5ForConditionalGeneration (None in mock mode).
        mock_mode:     If True, skip real inference and return stub output.

    Returns:
        Enhanced prompt string, or raises ValueError if output is bad.
    """
    if mock_mode:
        # --- MOCK PATH ---
        # Returns a realistic-looking placeholder so we can test the full stack.
        mock_output = (
            f"[MOCK ENHANCED] You are an expert assistant. "
            f"Help the user with the following task:\n\n"
            f"Task: {text.strip()}\n\n"
            f"Provide a clear, structured, and detailed response. "
            f"Use step-by-step format where applicable."
        )
        logger.debug("Mock enhance → returning stub output")
        return mock_output

    # --- REAL PATH ---
    import torch

    # Concatenate system prompt + prefix + user input
    full_input = f"{system_prompt} {prefix}{text}".strip()

    inputs = mt5_tokenizer(
        full_input,
        return_tensors="pt",
        max_length=128,
        truncation=True,
    )

    gen_kwargs: dict = {
        "max_new_tokens": MAX_NEW_TOKENS,
        "early_stopping": True,
    }

    if variant_mode:
        gen_kwargs["do_sample"] = True
        gen_kwargs["temperature"] = VARIANT_TEMPERATURE
    else:
        gen_kwargs["num_beams"] = NUM_BEAMS

    with torch.no_grad():
        output_ids = mt5_model.generate(
            input_ids=inputs["input_ids"],
            attention_mask=inputs["attention_mask"],
            **gen_kwargs,
        )

    decoded = mt5_tokenizer.decode(output_ids[0], skip_special_tokens=True)
    cleaned = decoded.strip()

    if not cleaned:
        raise ValueError("Model returned empty output")

    # Hallucination check
    tokens = cleaned.split()
    if check_hallucination(tokens):
        raise ValueError("Output flagged as repetitive or too short")

    return cleaned


# ─────────────────────────── STT inference ────────────────────────────────────

def run_stt(
    audio_bytes: bytes,
    lang: str,
    whisper_processor=None,
    whisper_model=None,
    mock_mode: bool = False,
) -> tuple[str, Optional[str]]:
    """
    Run Whisper Tiny speech-to-text transcription (FR-04).

    Args:
        audio_bytes:       Raw audio file bytes (any format; converted to WAV).
        lang:              "en" or "hi".
        whisper_processor: Loaded WhisperProcessor (None in mock mode).
        whisper_model:     Loaded WhisperForConditionalGeneration (None in mock mode).
        mock_mode:         If True, return stub transcript.

    Returns:
        (transcript_text, warning_or_None)
        e.g. ("hello world", None)  or  ("", "No speech detected")
    """
    if mock_mode:
        logger.debug("Mock STT → returning stub transcript")
        sample = (
            "meri website ke liye ek homepage design karo"
            if lang == "hi"
            else "create a homepage design for my website"
        )
        return sample, None

    # ── Real Whisper path ────────────────────────────────────────────────────
    import torch
    import soundfile as sf

    # Convert audio bytes → numpy array at 16kHz mono via soundfile + librosa
    try:
        audio_array, sample_rate = sf.read(io.BytesIO(audio_bytes))

        # Stereo → mono
        if audio_array.ndim > 1:
            audio_array = audio_array.mean(axis=1)

        # Resample to 16kHz if needed
        if sample_rate != TARGET_SAMPLE_RATE:
            import librosa
            audio_array = librosa.resample(
                audio_array.astype(np.float32),
                orig_sr=sample_rate,
                target_sr=TARGET_SAMPLE_RATE,
            )

        audio_array = audio_array.astype(np.float32)

    except Exception as exc:
        raise ValueError(f"Audio decoding failed: {exc}") from exc

    # Silence / noise threshold check
    rms = float(np.sqrt(np.mean(audio_array ** 2)))
    if rms < 0.001:
        return "", "No speech detected"

    # Whisper forced decoder language
    forced_decoder_ids = whisper_processor.get_decoder_prompt_ids(
        language=lang, task="transcribe"
    )

    inputs = whisper_processor(
        audio_array,
        sampling_rate=TARGET_SAMPLE_RATE,
        return_tensors="pt",
    )

    with torch.no_grad():
        output_ids = whisper_model.generate(
            inputs.input_features,
            forced_decoder_ids=forced_decoder_ids,
        )

    transcript = whisper_processor.decode(output_ids[0], skip_special_tokens=True)
    transcript, _ = normalize_script(transcript)

    if not transcript:
        return "", "No speech detected"

    return transcript, None
