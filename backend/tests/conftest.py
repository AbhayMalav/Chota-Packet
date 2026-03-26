"""
tests/conftest.py — Shared fixtures for Chota Packet backend tests.

All tests use mock/stub model objects so they run without real model weights.
client is function-scoped to prevent state mutations bleeding between tests.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock


@pytest.fixture
def mock_model_state():
    """Fresh ModelState in mock mode for each test."""
    from models import ModelState
    state = ModelState()
    state.loaded = True
    state.mock_mode = True
    state.whisper_processor = None
    state.whisper_model = None
    state.mt5_tokenizer = None
    state.mt5_model = None
    state.load_error = None
    return state


@pytest.fixture
def client(mock_model_state):
    """
    TestClient with mock model state and ffmpeg available.
    Function-scoped — each test gets a clean app state.
    """
    from main import app

    app.state.models = mock_model_state
    app.state.ffmpeg_available = True

    with TestClient(app, raise_server_exceptions=True) as c:
        yield c


@pytest.fixture
def client_no_ffmpeg(mock_model_state):
    """
    TestClient simulating an environment where ffmpeg is not available.
    Used to test the 503 guard on /stt in real (non-mock) mode.
    """
    from main import app
    from models import ModelState

    real_state = ModelState()
    real_state.loaded = True
    real_state.mock_mode = False   # real mode — ffmpeg absence matters
    real_state.whisper_processor = MagicMock()
    real_state.whisper_model = MagicMock()
    real_state.mt5_tokenizer = MagicMock()
    real_state.mt5_model = MagicMock()

    app.state.models = real_state
    app.state.ffmpeg_available = False

    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    
    # Restore defaults so other fixtures aren't affected
    app.state.ffmpeg_available = True
    app.state.models = mock_model_state