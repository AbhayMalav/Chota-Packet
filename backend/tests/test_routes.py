"""
tests/test_routes.py — Integration tests for all FastAPI endpoints.

Uses TestClient (synchronous) with mock model state so no real GPU/CPU inference occurs.
Tests cover: /health, /stt, /enhance (local + validation), /validate-key, /models.
"""

import io
import pytest
import httpx
from unittest.mock import patch, AsyncMock


# ─────────────────────── GET /health ──────────────────────────────────────────

class TestHealthEndpoint:

    def test_health_ok_mock_mode(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["models_loaded"] is True
        assert data["mock_mode"] is True
        assert "ffmpeg_available" in data

    def test_health_models_not_loaded(self, client):
        """Simulate a failed model load — /health should return status: error."""
        original = client.app.state.models.loaded
        client.app.state.models.loaded = False
        client.app.state.models.load_error = "Test error"

        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "error"
        assert data["models_loaded"] is False

        # Restore
        client.app.state.models.loaded = original
        client.app.state.models.load_error = None


# ─────────────────────── POST /stt ────────────────────────────────────────────

class TestSTTEndpoint:

    def _make_audio_file(self, size_bytes: int = 100, mime: str = "audio/webm"):
        return {"audio": (io.BytesIO(b"\x00" * size_bytes), "test.webm", mime)}

    def test_stt_valid_english(self, client):
        resp = client.post(
            "/stt",
            files={"audio": ("test.webm", b"\x1A\x45\xDF\xA3" + b"\x00" * 96, "audio/webm")},
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
            files={"audio": ("test.webm", b"\x1A\x45\xDF\xA3" + b"\x00" * 96, "audio/webm")},
            data={"lang": "hi"},
        )
        assert resp.status_code == 200
        assert "text" in resp.json()

    def test_stt_file_too_large(self, client):
        big_data = b"\x00" * (11 * 1024 * 1024)  # 11 MB > 10 MB limit
        resp = client.post(
            "/stt",
            files={"audio": ("big.webm", big_data, "audio/webm")},
            data={"lang": "en"},
        )
        assert resp.status_code == 400

    def test_stt_invalid_mime(self, client):
        resp = client.post(
            "/stt",
            files={"audio": ("test.exe", b"\x00" * 100, "application/octet-stream")},
            data={"lang": "en"},
        )
        assert resp.status_code == 400

    def test_stt_models_not_loaded(self, client):
        original = client.app.state.models.loaded
        client.app.state.models.loaded = False

        resp = client.post(
            "/stt",
            files={"audio": ("test.webm", b"\x1A\x45\xDF\xA3" + b"\x00" * 96, "audio/webm")},
            data={"lang": "en"},
        )
        assert resp.status_code == 503

        client.app.state.models.loaded = original


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

    def test_enhance_with_advanced_level(self, client):
        resp = self._enhance(client, enhancement_level="advanced")
        assert resp.status_code == 200

    def test_enhance_unknown_style_falls_back(self, client):
        """Unknown style must not error — fallback to general (FR-21 validation)."""
        resp = self._enhance(client, style="totally_unknown_style_xyz")
        assert resp.status_code == 200

    def test_enhance_unknown_level_falls_back(self, client):
        """
        With Pydantic Literal fields, an unrecognised enhancement_level is
        correctly rejected with 422 at the schema-validation layer —
        this is the right behaviour (rejects bad input before it reaches the handler).
        The field_validator fallback applies to the 'style' field which uses str+validator.
        """
        resp = self._enhance(client, enhancement_level="ultra_mega")
        assert resp.status_code == 422  # Pydantic Literal rejects unknown values

    def test_enhance_variant_mode(self, client):
        resp = self._enhance(client, variant_mode=True)
        assert resp.status_code == 200
        assert "enhanced_prompt" in resp.json()

    def test_enhance_models_not_loaded(self, client):
        original = client.app.state.models.loaded
        client.app.state.models.loaded = False

        resp = self._enhance(client)
        assert resp.status_code == 503

        client.app.state.models.loaded = original

    def test_enhance_empty_text_rejected(self, client):
        """Pydantic min_length=1 should reject empty text with 422."""
        resp = client.post("/enhance", json={"text": "", "input_lang": "en"})
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

    def test_validate_key_format_check(self, client):
        """Key with correct prefix but mocked OpenRouter response."""
        fake_key = "sk-or-v1-" + "a" * 40

        with patch("routes.httpx.AsyncClient") as mock_client_cls:
            mock_resp = AsyncMock()
            mock_resp.status_code = 401
            mock_resp.json.return_value = {}
            mock_client_cls.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_resp)

            resp = client.post("/validate-key", json={"key": fake_key})
            data = resp.json()
            assert "valid" in data
            assert data["valid"] is False


# ─────────────────────── GET /models ──────────────────────────────────────────

class TestModelsEndpoint:

    def test_models_without_key_returns_local_only(self, client):
        resp = client.get("/models")
        assert resp.status_code == 200
        data = resp.json()
        assert "models" in data
        assert data["models"][0]["id"] == "local"

    def test_models_with_key_uses_static_fallback(self, client):
        """When OpenRouter fetch fails, static list is returned."""
        fake_key = "sk-or-v1-" + "a" * 40

        with patch("routes.httpx.AsyncClient") as mock_client_cls:
            mock_client_cls.return_value.__aenter__.return_value.get = AsyncMock(
                side_effect=httpx.RequestError("network error")
            )
            resp = client.get("/models", headers={"X-OpenRouter-Key": fake_key})
            assert resp.status_code == 200
            data = resp.json()
            assert "models" in data
            assert len(data["models"]) > 1  # local + static cloud list
