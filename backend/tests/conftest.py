"""
tests/conftest.py — Shared fixtures for Chota Packet backend tests.

All tests use mock/stub model objects so they run in <30 seconds
without loading the real ~1.5 GB model weights (FR-39 constraint).
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch


@pytest.fixture(scope="session")
def mock_model_state():
    """Return a ModelState that simulates successful mock-mode loading."""
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


@pytest.fixture(scope="session")
def client(mock_model_state):
    """
    TestClient with models pre-loaded in mock mode and ffmpeg assumed available.
    We patch the lifespan to inject mock state directly.
    """
    from main import app

    # Override app state to avoid real model loading in tests
    app.state.models = mock_model_state
    app.state.ffmpeg_available = True

    with TestClient(app, raise_server_exceptions=True) as c:
        yield c


@pytest.fixture
def real_model_state():
    """
    ModelState simulating loaded real models for tests that need
    to verify real-model code paths via mocks.
    """
    from models import ModelState
    state = ModelState()
    state.loaded = True
    state.mock_mode = False
    state.whisper_processor = MagicMock()
    state.whisper_model = MagicMock()
    state.mt5_tokenizer = MagicMock()
    state.mt5_model = MagicMock()
    return state
