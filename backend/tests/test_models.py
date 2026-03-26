"""
tests/test_models.py — Unit tests for model loading, prefix builder,
hallucination detection, script normalization, and inference stubs.
"""

from __future__ import annotations

import pytest
from unittest.mock import MagicMock, patch
import numpy as np


# ──────────────────────── Prefix builder ──────────────────────────────────────


class TestBuildPrefix:

    def test_default_english(self):
        from models import build_prefix
        assert build_prefix("en", "general", "", "basic") == "enhance prompt: "

    def test_default_hindi(self):
        from models import build_prefix
        assert build_prefix("hi", "general", "", "basic") == "prompt sudharo: "

    def test_style_code_english(self):
        from models import build_prefix
        result = build_prefix("en", "code", "", "basic")
        assert "[code]" in result
        assert result.endswith(": ")

    def test_tone_formal(self):
        from models import build_prefix
        assert "[formal]" in build_prefix("en", "general", "formal", "basic")

    def test_enhancement_level_advanced(self):
        from models import build_prefix
        assert "[advanced]" in build_prefix("en", "general", "", "advanced")

    def test_style_and_tone_combined(self):
        from models import build_prefix
        result = build_prefix("en", "code", "technical", "detailed")
        assert "[code]" in result
        assert "[technical]" in result
        assert "[detailed]" in result

    def test_cross_lingual_hi_to_en(self):
        from models import build_prefix
        assert "output: English" in build_prefix("hi", "general", "", "basic", output_lang="en")

    def test_cross_lingual_en_to_hi(self):
        from models import build_prefix
        assert "output: Hindi" in build_prefix("en", "general", "", "basic", output_lang="hi")

    def test_auto_output_lang_no_cross_lingual_tag(self):
        from models import build_prefix
        assert "output:" not in build_prefix("en", "general", "", "basic", output_lang="auto")

    def test_basic_level_no_level_tag(self):
        """Basic level must not emit a [basic] tag — keeps prefix clean."""
        from models import build_prefix
        assert "[basic]" not in build_prefix("en", "general", "", "basic")

    def test_unknown_input_lang_falls_back_to_en(self):
        from models import build_prefix
        result = build_prefix("fr", "general", "", "basic")
        assert result.startswith("enhance prompt")


# ──────────────────────── Hallucination detection ─────────────────────────────


class TestHallucinationDetection:

    def test_too_short_triggers(self):
        from models import check_hallucination
        # HALLUCINATION_MIN_TOKENS = 5; 2 tokens is clearly below threshold
        assert check_hallucination(["hello", "world"]) is True

    def test_exactly_at_min_length_passes(self):
        from models import check_hallucination
        from config import HALLUCINATION_MIN_TOKENS
        tokens = ["word"] * HALLUCINATION_MIN_TOKENS
        # Min length passes but may trigger n-gram check — just verify no crash
        result = check_hallucination(tokens)
        assert isinstance(result, bool)

    def test_normal_varied_sentence_passes(self):
        from models import check_hallucination
        sentence = (
            "You are a professional engineer who writes clean maintainable "
            "Python code following PEP eight best practices every single day."
        ).split()
        assert check_hallucination(sentence) is False

    def test_4gram_repeat_triggers(self):
        from models import check_hallucination
        # 5 repeats of the same 4-gram well exceeds HALLUCINATION_MAX_REPEATS=3
        tokens = (["a", "b", "c", "d"] * 5) + ["extra"] * 5
        assert check_hallucination(tokens) is True

    def test_empty_token_list(self):
        from models import check_hallucination
        assert check_hallucination([]) is True


# ──────────────────────── Script normalization ────────────────────────────────


class TestScriptNormalization:

    def test_devanagari_detection(self):
        from models import normalize_script
        cleaned, script = normalize_script("मेरी दुकान के लिए वेबसाइट बनाओ")
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

    def test_hinglish_false_positive_sake(self):
        """'sake' contains 'ke' but must not be detected as Hinglish."""
        from models import normalize_script
        _, script = normalize_script("for goodness sake please help me")
        assert script == "en"

    def test_hinglish_false_positive_kayak(self):
        """'kayak' contains 'ka' but must not be detected as Hinglish."""
        from models import normalize_script
        _, script = normalize_script("I rented a kayak for the weekend")
        assert script == "en"

    def test_empty_string(self):
        from models import normalize_script
        cleaned, script = normalize_script("")
        assert cleaned == ""
        assert script == "en"


# ──────────────────────── Audio decoding ──────────────────────────────────────


class TestDecodeAudioViaFfmpeg:

    def test_success_returns_float32_array(self):
        from models import _decode_audio_via_ffmpeg
        import subprocess

        fake_pcm = np.zeros(16000, dtype=np.float32).tobytes()

        with patch("models.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout=fake_pcm,
                stderr=b"",
            )
            result = _decode_audio_via_ffmpeg(b"fake_audio_bytes")
            assert result.dtype == np.float32
            assert len(result) == 16000

    def test_nonzero_returncode_raises_valueerror(self):
        from models import _decode_audio_via_ffmpeg

        with patch("models.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=1,
                stdout=b"",
                stderr=b"Invalid data found when processing input",
            )
            with pytest.raises(ValueError, match="ffmpeg audio conversion failed"):
                _decode_audio_via_ffmpeg(b"corrupt_audio")

    def test_empty_stdout_raises_valueerror(self):
        from models import _decode_audio_via_ffmpeg

        with patch("models.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(returncode=0, stdout=b"", stderr=b"")
            with pytest.raises(ValueError, match="empty audio output"):
                _decode_audio_via_ffmpeg(b"silent_file")

    def test_timeout_raises_valueerror(self):
        from models import _decode_audio_via_ffmpeg
        import subprocess

        with patch("models.subprocess.run", side_effect=subprocess.TimeoutExpired("ffmpeg", 30)):
            with pytest.raises(ValueError, match="timed out"):
                _decode_audio_via_ffmpeg(b"huge_audio")

    def test_ffmpeg_not_found_raises_valueerror(self):
        from models import _decode_audio_via_ffmpeg

        with patch("models.subprocess.run", side_effect=FileNotFoundError):
            with pytest.raises(ValueError, match="ffmpeg not available"):
                _decode_audio_via_ffmpeg(b"any_audio")


# ──────────────────────── Mock inference ──────────────────────────────────────


class TestMockInference:

    def test_mock_enhance_returns_nonempty_string(self):
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

    def test_mock_enhance_variant_mode_still_works(self):
        from models import run_local_enhance
        result = run_local_enhance(
            text="make website",
            prefix="enhance prompt: ",
            system_prompt="Rewrite this.",
            variant_mode=True,
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

    def test_ffmpeg_found_returns_true(self):
        """Mocked ffmpeg available — must return True."""
        from models import check_ffmpeg
        import subprocess

        with patch("models.subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout=b"ffmpeg version 6.1.1\n",
            )
            assert check_ffmpeg() is True

    def test_ffmpeg_not_found_returns_false(self):
        """FileNotFoundError from subprocess → must return False, not raise."""
        from models import check_ffmpeg

        with patch("models.subprocess.run", side_effect=FileNotFoundError):
            assert check_ffmpeg() is False

    def test_ffmpeg_timeout_returns_false(self):
        from models import check_ffmpeg
        import subprocess

        with patch("models.subprocess.run", side_effect=subprocess.TimeoutExpired("ffmpeg", 5)):
            assert check_ffmpeg() is False

    def test_ffmpeg_oserror_returns_false(self):
        """OSError covers snap/flatpak restricted PATH — must return False."""
        from models import check_ffmpeg

        with patch("models.subprocess.run", side_effect=OSError("permission denied")):
            assert check_ffmpeg() is False


# ──────────────────────── Model loading ──────────────────────────────────────


class TestLoadModels:

    def test_mock_mode_when_no_model_dir(self):
        """No model directory → mock mode, loaded=True, no exception."""
        from models import load_models

        with patch("models.os.path.isdir", return_value=False):
            state = load_models()
            assert state.mock_mode is True
            assert state.loaded is True
            assert state.load_error is None