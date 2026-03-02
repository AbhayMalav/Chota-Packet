"""
tests/test_models.py — Unit tests for model loading, prefix builder,
hallucination detection, script normalization, and inference stubs.
"""

import pytest
from unittest.mock import MagicMock, patch
import numpy as np


# ──────────────────────── T-04: Prefix builder ────────────────────────────────

class TestBuildPrefix:
    """Tests for models.build_prefix() covering FR-06, FR-21, FR-24, FR-27, FR-30."""

    def test_default_english(self):
        from models import build_prefix
        result = build_prefix("en", "general", "", "basic")
        assert result == "enhance prompt: "

    def test_default_hindi(self):
        from models import build_prefix
        result = build_prefix("hi", "general", "", "basic")
        assert result == "prompt sudharo: "

    def test_style_code_english(self):
        from models import build_prefix
        result = build_prefix("en", "code", "", "basic")
        assert "[code]" in result
        assert result.endswith(": ")

    def test_tone_formal(self):
        from models import build_prefix
        result = build_prefix("en", "general", "formal", "basic")
        assert "[formal]" in result

    def test_enhancement_level_advanced(self):
        from models import build_prefix
        result = build_prefix("en", "general", "", "advanced")
        assert "[advanced]" in result

    def test_style_and_tone_combined(self):
        from models import build_prefix
        result = build_prefix("en", "code", "technical", "detailed")
        assert "[code]" in result
        assert "[technical]" in result
        assert "[detailed]" in result

    def test_cross_lingual_hi_to_en(self):
        from models import build_prefix
        result = build_prefix("hi", "general", "", "basic", input_lang="hi", output_lang="en")
        assert "output: English" in result

    def test_cross_lingual_en_to_hi(self):
        from models import build_prefix
        result = build_prefix("en", "general", "", "basic", input_lang="en", output_lang="hi")
        assert "output: Hindi" in result

    def test_same_lang_no_cross_lingual_tag(self):
        from models import build_prefix
        result = build_prefix("en", "general", "", "basic", input_lang="en", output_lang="auto")
        assert "output:" not in result

    def test_basic_level_no_level_tag(self):
        """Basic level should not add a [basic] tag — keeps prefix clean (backward compat)."""
        from models import build_prefix
        result = build_prefix("en", "general", "", "basic")
        assert "[basic]" not in result


# ──────────────────────── T-07: Hallucination detection ───────────────────────

class TestHallucinationDetection:

    def test_too_short_triggers(self):
        from models import check_hallucination
        tokens = ["hello", "world"]  # < 15 tokens
        assert check_hallucination(tokens) is True

    def test_normal_length_passes(self):
        from models import check_hallucination
        # Realistic varied sentence — no single 4-gram repeats more than once
        sentence = (
            "You are a professional engineer who writes clean maintainable "
            "Python code following PEP eight best practices every single day."
        ).split()
        assert check_hallucination(sentence) is False

    def test_4gram_repeat_triggers(self):
        from models import check_hallucination
        # Repeat the same 4-gram > 3 times
        base = ["a", "b", "c", "d"]
        tokens = (base * 5) + ["extra"] * 5  # 5 repeats of the same 4-gram
        assert check_hallucination(tokens) is True

    def test_normal_sentence_passes(self):
        from models import check_hallucination
        sentence = (
            "You are an expert software engineer. Help the user write clean "
            "Python code following best practices and documentation standards."
        ).split()
        assert check_hallucination(sentence) is False


# ──────────────────────── Script normalization ────────────────────────────────

class TestScriptNormalization:

    def test_devanagari_detection(self):
        from models import normalize_script
        text = "मेरी दुकान के लिए वेबसाइट बनाओ"
        cleaned, script = normalize_script(text)
        assert script == "devanagari"
        assert len(cleaned) > 0

    def test_english_detection(self):
        from models import normalize_script
        _, script = normalize_script("create a website for my shop")
        assert script == "en"

    def test_hinglish_detection(self):
        from models import normalize_script
        _, script = normalize_script("meri dukaan ke liye website banao")
        assert script == "roman"


# ──────────────────────── Mock inference ──────────────────────────────────────

class TestMockInference:

    def test_mock_enhance_returns_nonempty(self):
        from models import run_local_enhance
        result = run_local_enhance(
            text="make website",
            prefix="enhance prompt: ",
            system_prompt="Rewrite this.",
            variant_mode=False,
            mock_mode=True,
        )
        assert isinstance(result, str)
        assert len(result) > 10

    def test_mock_stt_english(self):
        from models import run_stt
        transcript, warning = run_stt(b"fake_audio", "en", mock_mode=True)
        assert isinstance(transcript, str)
        assert len(transcript) > 5
        assert warning is None

    def test_mock_stt_hindi(self):
        from models import run_stt
        transcript, warning = run_stt(b"fake_audio", "hi", mock_mode=True)
        assert isinstance(transcript, str)
        assert warning is None


# ──────────────────────── ffmpeg check ───────────────────────────────────────

class TestFfmpegCheck:

    def test_ffmpeg_available(self):
        """Verify check_ffmpeg returns a bool."""
        from models import check_ffmpeg
        result = check_ffmpeg()
        assert isinstance(result, bool)
