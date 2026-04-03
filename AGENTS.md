# Agent Documentation (`AGENTS.md`)

Welcome! If you are an AI assistant or Agent reading this, this file provides essential architectural context, codebase rules, and paradigms regarding the **Chota-Packet** project. Please review this carefully before executing commands or restructuring files.

## 1. Project Paradigm
**Chota-Packet** is an AI prompt refinement tool. It connects a React front-end to a FastAPI backend that runs local LLM/mT5 LoRA integrations or interfaces via OpenRouter. 

> **Important**: This project was historically built using a "vibe coding" methodology. Expect slightly unconventional data flows and be flexible. Do not overly-engineer solutions unless explicitly requested by the user. Keep it simple and focused.

## 2. Tech Stack
- **Frontend**: React 19 (Vite), Tailwind CSS v4, `react-router-dom` (SPA, single route `/`)
- **Backend**: FastAPI (Python 3.10+), uvicorn, mT5 + Whisper Tiny for local inference

## 3. Build / Lint / Test Commands

### Frontend (`frontend/`)
```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run lint         # ESLint check (fix: `npm run lint -- --fix`)
npm run preview      # Preview production build

npm test             # Vitest watch mode
npm run test:run     # Vitest run once (CI mode)
npm test -- -t "test name"    # Run single test by name pattern
npm test -- path/to/file.test.jsx  # Run single test file
```

### Backend (`backend/`)
```bash
pip install -r requirements.txt -r requirements-dev.txt
uvicorn main:app --reload       # Start FastAPI dev server

pytest                          # Run all tests (coverage enforced ≥80%)
pytest -v                       # Verbose output
pytest tests/test_file.py       # Run single test file
pytest -k "test_name"           # Run single test by name pattern
pytest --no-cov                 # Skip coverage (faster)
```

### Import Checker
After refactoring imports or moving files, run `node import-checker.js` in `frontend/` to detect broken imports.

## 4. Code Style Guidelines

### General
- **No comments** unless explicitly asked by the user
- Keep it simple — avoid over-engineering
- Follow existing patterns; mimic code style in neighboring files

### Frontend (JavaScript/JSX)
- **Files**: `.jsx` for components, `.js` for utilities/hooks
- **Imports**: Grouped — React first, then libraries, then local (`../`)
- **Components**: PascalCase (`InputArea`, `ControlBar`). Default exports for components
- **Hooks**: camelCase with `use` prefix (`useEnhance`, `useSettings`). Default exports
- **Constants**: UPPER_SNAKE_CASE in `src/config/constants.js`
- **No TypeScript** — plain JavaScript with JSDoc only where helpful
- **Error handling**: Try/catch at hook level; return null on cancel, throw on real errors
- **State**: `useReducer` in `Home.jsx` for central state; `useState` for local component state
- **CSS**: Tailwind utility classes preferred. Component-specific CSS lives adjacent to component (e.g., `ControlBar.jsx` + `ControlBar.css`). Never in `src/styles/`

### Backend (Python)
- **Imports**: `from __future__ import annotations` at top. Standard library → third-party → local
- **Modules**: snake_case filenames (`models.py`, `routes.py`)
- **Classes**: PascalCase (`ModelState`, `EnhanceRequest`)
- **Functions**: snake_case (`run_local_enhance`, `build_prefix`)
- **Constants**: UPPER_SNAKE_CASE in `config.py`
- **Type hints**: Use throughout (`typing.Optional`, `typing.Annotated`, etc.)
- **Error handling**: Raise `HTTPException` with status code and detail message
- **Logging**: `logger = logging.getLogger(__name__)` per module
- **Pydantic**: Use `BaseModel` with `Field()` and `field_validator` for request validation

### UI / UX Design Principles
- **Glassmorphism**: Glass panels, gradients, dynamic animations (`glass-navbar`, `glass-card`)
- **Dark Mode First**: Use Tailwind dark mode or `.light` wrapper for light theme
- **Micro-interactions**: Hover, active, focus states critical (`hover:`, `active:`, `focus:`)

## 5. Directory Structure

### Frontend (`frontend/src/`)
- `pages/` — Route-level components (`Home.jsx`)
- `components/core/` — Main functional UI (InputArea, ControlBar, OutputCard, DiffView)
- `components/layout/` — Structural shell (Sidebar/, NavBar/)
- `components/modals/` — SettingsModal, ShortcutsModal, OnboardingOverlay
- `components/ui/` — MicButton, StatusBanner, FeedbackBar, icons.jsx
- `config/` — ALL constants (`constants.js`) and feature flags (`config.js`)
- `context/` — React Context Providers (Theme, User, Incognito, Session)
- `hooks/` — Custom hooks (useSettings, useEnhance, useRecorder, usePinned, etc.)
- `services/` — API calls (`api.js`), crypto, clipboard, historyService
- `styles/` — Global CSS only (`utils.css`)

### Backend (`backend/`)
- `main.py` — FastAPI app entry point
- `routes.py` — All route handlers (/health, /enhance, /stt, /validate-key, /models)
- `models.py` — Model loading, inference, post-processing (mT5 + Whisper)
- `config.py` — Configuration constants
- `enhancement_prompts.py` — System prompts for enhancement
- `openrouter_models.py` — OpenRouter model definitions
- `tests/` — Pytest test suite

## 6. Adding Dependencies
- Frontend: `npm install <package>` — ask before adding heavy UI libraries
- Backend: Add to `requirements.txt` or `requirements-dev.txt`
- Prefer Tailwind + custom components over monolithic UI bundles

## 7. Architecture Notes
- **Single-page app**: Entire app on `/` via `Home.jsx`. No dynamic routes
- **API**: Axios with `baseURL: API_BASE`, timeout 20s, optional `X-OpenRouter-Key` header
- **Encryption**: AES-256-GCM via Web Crypto API (PBKDF2, 100K iterations)
- **localStorage**: API key (encrypted), model, theme, pinned history (max 10), feedback (max 100)
- **Backend dual-mode**: Real mT5+Whisper if weights present; mock stub otherwise (dev/CI friendly)
- **transformers pinned**: Keep below v5.0 — breaking API changes in v5
