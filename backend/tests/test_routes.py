"""
tests/test_routes.py — Integration tests for all FastAPI endpoints.

Uses TestClient (synchronous) with mock model state so no real inference occurs.
All audio magic bytes use single-backslash escapes (b"\x1A...") — double-backslash
would produce literal ASCII characters, not the actual byte values.
"""

from __future__ import annotations

import pytest
import httpx
from unittest.mock import patch, AsyncMock


# ─────────────────────── GET / ────────────────────────────────────────────────


class TestRootEndpoint:

    def test_root_returns_ok(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["service"] == "Chota Packet API"
        assert "docs" in data

    def test_root_never_404(self, client):
        """Render health checker hits / — must never 404."""
        resp = client.get("/")
        assert resp.status_code != 404


# ─────────────────────── GET /health ──────────────────────────────────────────


class TestHealthEndpoint:

    def test_health_ok_mock_mode(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["models_loaded"] is True
        assert data["mock_mode"] is True
        assert "ffmpeg_available" in data

    def test_health_models_not_loaded(self, client):
        """Simulate a failed model load — /health should return status: error."""
        original_loaded = client.app.state.models.loaded
        original_error = client.app.state.models.load_error
        try:
            client.app.state.models.loaded = False
            client.app.state.models.load_error = "Test load error"

            resp = client.get("/health")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "error"
            assert data["models_loaded"] is False
            assert data["detail"] == "Test load error"
        finally:
            client.app.state.models.loaded = original_loaded
            client.app.state.models.load_error = original_error

    def test_health_ui_renders(self, client):
        """Health dashboard HTML endpoint must return 200 with HTML content."""
        resp = client.get("/health/ui")
        assert resp.status_code == 200
        assert "text/html" in resp.headers["content-type"]
        assert "Chota Packet" in resp.text
        assert "/health" in resp.text  # JS polls this endpoint


# ─────────────────────── POST /stt ────────────────────────────────────────────


# Real WebM magic bytes — b"\x1A\x45\xDF\xA3" (single backslash = actual bytes)
_WEBM_MAGIC = b"\x1A\x45\xDF\xA3"
_OGG_MAGIC  = b"OggS"
_WAV_MAGIC  = b"RIFF" + b"\x00" * 4 + b"WAVE"


class TestSTTEndpoint:

    def test_stt_valid_english(self, client):
        resp = client.post(
            "/stt",
            files={"audio": ("test.webm", _WEBM_MAGIC + b"\x00" * 96, "audio/webm")},
            data={"lang": "en"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "text" in data
        assert isinstance(data["text"], str)
        assert len(data["text"]) > 0

    def test_stt_valid_hindi(self, client):
        resp = client.post(
            "/stt",
            files={"audio": ("test.webm", _WEBM_MAGIC + b"\x00" * 96, "audio/webm")},
            data={"lang": "hi"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "text" in data
        assert isinstance(data["text"], str)

    def test_stt_unknown_lang_coerced_to_en(self, client):
        """Unknown lang value must be coerced to 'en', not error."""
        resp = client.post(
            "/stt",
            files={"audio": ("test.webm", _WEBM_MAGIC + b"\x00" * 96, "audio/webm")},
            data={"lang": "fr"},
        )
        assert resp.status_code == 200

    def test_stt_file_too_large(self, client):
        big_data = b"\x00" * (11 * 1024 * 1024)  # 11 MB > 10 MB limit
        resp = client.post(
            "/stt",
            files={"audio": ("big.webm", big_data, "audio/webm")},
            data={"lang": "en"},
        )
        assert resp.status_code == 400
        assert "error" in resp.json()

    def test_stt_invalid_magic_bytes(self, client):
        """File with no valid audio magic bytes must be rejected at magic bytes check."""
        resp = client.post(
            "/stt",
            files={"audio": ("fake.webm", b"\x00" * 100, "audio/webm")},
            data={"lang": "en"},
        )
        assert resp.status_code == 400
        data = resp.json()
        assert data["detail"]["error"] == "Invalid audio file"

    def test_stt_invalid_mime_with_valid_magic(self, client):
        """
        Valid magic bytes but unsupported MIME type must be rejected at MIME check.
        We use valid WebM magic so the magic bytes check passes and MIME check fires.
        """
        resp = client.post(
            "/stt",
            files={"audio": ("test.webm", _WEBM_MAGIC + b"\x00" * 96, "application/octet-stream")},
            data={"lang": "en"},
        )
        assert resp.status_code == 400
        assert "error" in resp.json()["detail"]

    def test_stt_models_not_loaded(self, client):
        original = client.app.state.models.loaded
        try:
            client.app.state.models.loaded = False
            resp = client.post(
                "/stt",
                files={"audio": ("test.webm", _WEBM_MAGIC + b"\x00" * 96, "audio/webm")},
                data={"lang": "en"},
            )
            assert resp.status_code == 503
        finally:
            client.app.state.models.loaded = original

    def test_stt_no_ffmpeg_real_mode(self, client_no_ffmpeg):
        """Real mode without ffmpeg must return 503 before touching the file."""
        resp = client_no_ffmpeg.post(
            "/stt",
            files={"audio": ("test.webm", _WEBM_MAGIC + b"\x00" * 96, "audio/webm")},
            data={"lang": "en"},
        )
        assert resp.status_code == 503
        assert "ffmpeg" in resp.json()["detail"].lower()


# ─────────────────────── POST /enhance ───────────────────────────────────────


class TestEnhanceEndpoint:

    def _enhance(self, client, **kwargs):
        payload = {
            "text": "make a website for my shop",
            "input_lang": "en",
            "enhancement_level": "basic",
        }
        payload.update(kwargs)
        return client.post("/enhance", json=payload)

    def test_enhance_basic_english(self, client):
        resp = self._enhance(client)
        assert resp.status_code == 200
        data = resp.json()
        assert "enhanced_prompt" in data
        assert len(data["enhanced_prompt"]) > 10
        assert data["mock_mode"] is True

    def test_enhance_basic_hindi(self, client):
        resp = self._enhance(client, input_lang="hi", text="meri dukaan ke liye website banao")
        assert resp.status_code == 200
        assert "enhanced_prompt" in resp.json()

    def test_enhance_with_style(self, client):
        resp = self._enhance(client, style="code")
        assert resp.status_code == 200

    def test_enhance_with_tone(self, client):
        resp = self._enhance(client, tone="formal")
        assert resp.status_code == 200

    def test_enhance_all_levels(self, client):
        """Every valid enhancement level must return 200."""
        levels = [
            "basic", "detailed", "chain_of_thought", "meta",
            "prompt_chaining", "multi_prompt_fusion", "soft_prompting", "advanced",
        ]
        for level in levels:
            resp = self._enhance(client, enhancement_level=level)
            assert resp.status_code == 200, f"Level '{level}' returned {resp.status_code}"

    def test_enhance_unknown_style_falls_back(self, client):
        """Unknown style must not error — validator falls back to 'general'."""
        resp = self._enhance(client, style="totally_unknown_style_xyz")
        assert resp.status_code == 200

    def test_enhance_unknown_level_rejected_by_pydantic(self, client):
        """
        Pydantic Literal rejects unknown enhancement_level at schema validation.
        The field_validator fallback only applies to 'style' (str type + validator).
        """
        resp = self._enhance(client, enhancement_level="ultra_mega")
        assert resp.status_code == 422

    def test_enhance_variant_mode(self, client):
        resp = self._enhance(client, variant_mode=True)
        assert resp.status_code == 200
        assert "enhanced_prompt" in resp.json()

    def test_enhance_cross_lingual_hi_to_en(self, client):
        resp = self._enhance(client, input_lang="hi", output_lang="en",
                             text="meri dukaan ke liye website banao")
        assert resp.status_code == 200
        assert "enhanced_prompt" in resp.json()

    def test_enhance_models_not_loaded(self, client):
        original = client.app.state.models.loaded
        try:
            client.app.state.models.loaded = False
            resp = self._enhance(client)
            assert resp.status_code == 503
        finally:
            client.app.state.models.loaded = original

    def test_enhance_empty_text_rejected(self, client):
        """Pydantic min_length=1 must reject empty text with 422."""
        resp = client.post("/enhance", json={"text": "", "input_lang": "en"})
        assert resp.status_code == 422

    def test_enhance_text_over_limit_rejected(self, client):
        """Pydantic max_length must reject text over MAX_INPUT_CHARS."""
        resp = client.post("/enhance", json={"text": "a" * 600, "input_lang": "en"})
        assert resp.status_code == 422

    def test_enhance_cloud_without_key_header(self, client):
        """Cloud mode without X-OpenRouter-Key header must return 400."""
        resp = client.post("/enhance", json={
            "text": "test",
            "input_lang": "en",
            "inference_mode": "cloud",
            "model": "openai/gpt-4o",
        })
        assert resp.status_code == 400


# ─────────────────────── POST /validate-key ───────────────────────────────────


class TestValidateKeyEndpoint:

    def test_validate_key_bad_format(self, client):
        resp = client.post("/validate-key", json={"key": "definitely-not-a-valid-key"})
        assert resp.status_code == 400

    def test_validate_key_short_key_rejected(self, client):
        resp = client.post("/validate-key", json={"key": "sk-or-v1-short"})
        assert resp.status_code == 400

    def test_validate_key_invalid_openrouter_returns_false(self, client):
        """Valid format but OpenRouter returns 401 → valid: False (not a 4xx error)."""
        fake_key = "sk-or-v1-" + "a" * 40

        with patch("routes.httpx.AsyncClient") as mock_cls:
            mock_resp = AsyncMock()
            mock_resp.status_code = 401
            mock_resp.json.return_value = {}
            mock_cls.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_resp)

            resp = client.post("/validate-key", json={"key": fake_key})
            assert resp.status_code == 200
            data = resp.json()
            assert data["valid"] is False

    def test_validate_key_valid_key_returns_true(self, client):
        """Valid format + OpenRouter 200 → valid: True with credits field."""
        fake_key = "sk-or-v1-" + "a" * 40

        with patch("routes.httpx.AsyncClient") as mock_cls:
            mock_resp = AsyncMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = {
                "data": {"limit_remaining": 4.20, "rate_limit": {"requests": 100}}
            }
            mock_cls.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_resp)

            resp = client.post("/validate-key", json={"key": fake_key})
            assert resp.status_code == 200
            data = resp.json()
            assert data["valid"] is True
            assert data["credits_remaining"] == 4.20

    def test_validate_key_timeout_returns_408(self, client):
        fake_key = "sk-or-v1-" + "a" * 40

        with patch("routes.httpx.AsyncClient") as mock_cls:
            mock_cls.return_value.__aenter__.return_value.get = AsyncMock(
                side_effect=httpx.TimeoutException("timed out")
            )
            resp = client.post("/validate-key", json={"key": fake_key})
            assert resp.status_code == 408


# ─────────────────────── GET /models ──────────────────────────────────────────


class TestModelsEndpoint:

    def test_models_without_key_returns_pinned_only(self, client):
        """No key → only local + auto router (both pinned) are returned."""
        resp = client.get("/models")
        assert resp.status_code == 200
        data = resp.json()
        ids = [m["id"] for m in data["models"]]
        assert ids[0] == "local"
        assert "openrouter/auto" in ids
        assert data["source"] == "static_no_key"
        # No paid cloud models should appear without a key
        assert len(data["models"]) == 2

    def test_models_sort_order_local_first(self, client):
        """Local model is always first regardless of source."""
        resp = client.get("/models")
        assert resp.json()["models"][0]["id"] == "local"

    def test_models_with_key_uses_static_fallback_on_network_error(self, client):
        """When OpenRouter fetch fails with network error, static list is returned."""
        fake_key = "sk-or-v1-" + "a" * 40

        with patch("routes.httpx.AsyncClient") as mock_cls:
            mock_cls.return_value.__aenter__.return_value.get = AsyncMock(
                side_effect=httpx.RequestError("network error")
            )
            resp = client.get("/models", headers={"X-OpenRouter-Key": fake_key})
            assert resp.status_code == 200
            data = resp.json()
            assert data["source"] == "static_fallback"
            assert len(data["models"]) > 2  # local + auto router + static cloud list

    def test_models_with_key_uses_static_fallback_on_non200(self, client):
        """Non-200 from OpenRouter → static fallback, not 500."""
        fake_key = "sk-or-v1-" + "a" * 40

        with patch("routes.httpx.AsyncClient") as mock_cls:
            mock_resp = AsyncMock()
            mock_resp.status_code = 503
            mock_cls.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_resp)

            resp = client.get("/models", headers={"X-OpenRouter-Key": fake_key})
            assert resp.status_code == 200
            assert resp.json()["source"] == "static_fallback"

    def test_models_live_fetch_sort_order(self, client):
        """Live fetch: free models come before paid, local is always first."""
        fake_key = "sk-or-v1-" + "a" * 40

        fake_models = {
            "data": [
                {"id": "openai/gpt-4o", "name": "GPT-4o", "pricing": {"prompt": "0.005", "completion": "0.015"}, "context_length": 128000},
                {"id": "some-org/free-model", "name": "Free Model", "pricing": {"prompt": "0", "completion": "0"}, "context_length": 8192},
            ]
        }

        with patch("routes.httpx.AsyncClient") as mock_cls:
            mock_resp = AsyncMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = fake_models
            mock_cls.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_resp)

            resp = client.get("/models", headers={"X-OpenRouter-Key": fake_key})
            assert resp.status_code == 200
            models = resp.json()["models"]
            ids = [m["id"] for m in models]

            assert ids[0] == "local"
            free_idx = next(i for i, m in enumerate(models) if m["id"] == "some-org/free-model")
            paid_idx = next(i for i, m in enumerate(models) if m["id"] == "openai/gpt-4o")
            assert free_idx < paid_idx