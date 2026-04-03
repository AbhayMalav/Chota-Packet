# Agent Documentation (`AGENTS.md`)

Welcome! If you are an AI assistant or Agent reading this, this file provides essential architectural context, codebase rules, and paradigms regarding the **Chota-Packet** project. Please review this carefully before executing commands or restructuring files.

## 1. Project Paradigm
**Chota-Packet** is an AI prompt refinement tool. It connects a React front-end to a FastAPI backend that runs local LLM/mT5 LoRA integrations or interfaces via OpenRouter. 

> **Important**: This project was historically built using a "vibe coding" methodology. Expect slightly unconventional data flows and be flexible. Do not overly-engineer solutions unless explicitly requested by the user. Keep it simple and focused.

## 2. Tech Stack
- **Frontend**: React 19 (managed via Vite). 
- **Styling**: Tailwind CSS v4.0. Avoid creating new standalone `.css` files unless absolutely necessary. Rely on Tailwind utility classes whenever possible.
- **Routing**: `react-router-dom`.
- **Backend / API**: FastAPI (Python 3.10+).

## 3. Directory Structure & Architecture
The frontend codebase follows a **Feature / Domain Co-location** strategy:
- `src/pages/`: Contains all route-level components (e.g., `Home.jsx`).
- `src/components/`: Modular, reusable UI pieces grouped by structural logic (`core/`, `layout/`, `modals/`, `ui/`).
- `src/config/`: ALL application constants, settings, and flags (e.g. `constants.js`) MUST go here. Do not leak global variables into components.
- `src/context/`: Contains React Context Providers, grouped logically (e.g., `src/context/Session/`).
- `src/styles/`: Strictly for global files like `utils.css`. 

### CSS Colocation Rule
CSS files specific to a component **must** live adjacent to the component. 
**DO NOT** place component-specific CSS in the `src/styles/` directory. 
- **Correct**: `src/components/core/ControlBar.jsx` + `src/components/core/ControlBar.css`.
- **Incorrect**: `src/styles/components/ControlBar.css`.

## 4. UI / UX Design Principles
When answering UI requests, adhere to the following principles:
- **Glassmorphism**: The UI heavily relies on glass panels, gradients, and dynamic animations (e.g., `glass-navbar`, `glass-card`). 
- **Dark Mode First**: The application supports dynamic theming. Use Tailwind's dark mode or rely on the `.light` wrapper appended to standard dark components.
- **Micro-interactions**: Hover states, active states, and focus layouts are critical. Ensure buttons provide adequate feedback (Tailwind's `active:`, `hover:`, `focus:` classes).

## 5. Adding New Dependencies
- Prefer `npm install <package>` for frontend.
- Ask the user before adding heavy UI libraries. We prefer sticking to Tailwind and custom components over monolithic bundles (e.g., avoid pulling in full Material UI or Ant Design).

## 6. Testing Routine
- If you refactor imports or move files, run the provided script `node import-checker.js` (if available in the frontend root) to find broken imports across `.jsx`/`.js` files. It is faster and more reliable than waiting for a full Vite error chain.

---

## 7. Frontend Summary

### 7.1 Application Overview
Chota Packet is a **single-page application** — the entire app lives on one route (`/`) rendered by `Home.jsx`. `react-router-dom` is installed but only provides `BrowserRouter` wrapping. There are no dynamic routes, nested routes, or programmatic navigation.

### 7.2 Pages
| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `pages/Home.jsx` | Entire application: prompt input, enhancement controls, output display, sidebar, all modals |

### 7.3 Context Providers (nesting order: outer → inner)
| Provider | File | Purpose |
|----------|------|---------|
| `ThemeProvider` | `context/ThemeContext.jsx` | Mode (`light`/`dark`/`system`) + 7 color palettes. Persists to localStorage. Listens for system color scheme changes. |
| `UserProvider` | `context/UserContext.jsx` | Mock user placeholder (`Guest User`). Prepares for future auth. |
| `IncognitoProvider` | `context/IncognitoContext.jsx` | Boolean toggle — when active, history is not saved. |
| `SessionProvider` | `context/Session/` | Provides `resetSession` for starting fresh threads. |

### 7.4 Custom Hooks
| Hook | File | Purpose |
|------|------|---------|
| `useSettings` | `hooks/useSettings.js` | API key (encrypted), model selection, auto-fallback to free model, inference mode (`cloud` vs `local`), key validation |
| `useEnhance` | `hooks/useEnhance.js` | Wraps `/enhance` API call with `AbortController`. Cancels previous requests automatically. Returns `{ run, abort }` |
| `useRecorder` | `hooks/useRecorder.js` | Microphone lifecycle: permission, MediaRecorder, auto-stop timeout, STT API call, cleanup on unmount |
| `usePinned` | `hooks/usePinned.js` | Pinned history items with localStorage persistence, debounced writes (300ms), deduplication, MAX_PINNED cap |
| `useMediaQuery` | `hooks/useMediaQuery.js` | Reactive CSS media query listener. SSR-safe. Returns boolean |
| `useTokenAnalytics` | `hooks/useTokenAnalytics.js` | Tracks enhancement stats: tokens in/out, cost estimation ($0.003/1K), efficiency score (0-100), letter grade (A+ to F) |
| `useAutoSettings` | `hooks/useAutoSettings.js` | **LEGACY/UNUSED** — superseded by `useSettings.js` + `crypto.js` |

### 7.5 Component Architecture
**Core** (`components/core/`): Main functional UI
- `InputArea` — Auto-resizing textarea, char counter, over-limit warning, clear button, children slot (MicButton)
- `ControlBar` — Style/Tone/Level/Output dropdowns, Enhance button with spinner, inline ModelPill, Regenerate button
- `OutputCard` — Editable enhanced output, copy, "Take it to" dropdown (10 AI sites), word/char count, FeedbackBar, clear
- `DiffView` — Side-by-side semantic diff using `diff-match-patch` (green added, red removed)

**Layout** (`components/layout/`): Structural shell
- `Sidebar/` — Collapsible sidebar with its own `SidebarContext`. Contains: NewThreadButton, ChotaChatButton (feature-flagged), HistorySection, IncognitoToggle, SettingsMenu, UserButton, UserMenu, AppearancePanel
- `NavBar/` — NavBtn, KbdHint, ModeIndicator (Cloud/Local badge)

**Modals** (`components/modals/`):
- `SettingsModal` — API key management (save/clear/validate), inference mode display, model selector, shortcuts link
- `ShortcutsModal` — 20+ keyboard shortcuts reference in 4 groups
- `OnboardingOverlay` — First-time welcome, persists `LS_ONBOARDED` flag

**UI** (`components/ui/`):
- `MicButton` — Voice input with recording state, error display, spinner
- `StatusBanner` — Backend connection indicator (ok/loading/error), dismissible
- `FeedbackBar` — Thumbs up/down, persisted to localStorage (capped at 100)
- `TokensAnalytics` — Stats display: tokens saved, cost saved, prompts improved, efficiency grade
- `ErrorBoundary` — Class component, glassmorphic error card, dev-only error detail
- `icons.jsx` — 30+ SVG icons including AI brand logos (Claude, Perplexity, Grok, DeepSeek, Mistral, Sarvam AI, AI Fiesta)

### 7.6 API Integration (`services/api.js`)
All API calls use **Axios** with `baseURL: API_BASE` and `timeout: 20000ms`:

| Endpoint | Method | Function | Purpose |
|----------|--------|----------|---------|
| `/health` | GET | `health()` | Backend connectivity check on mount (5s timeout) |
| `/enhance` | POST | `enhance(payload, key, signal)` | Core prompt enhancement. Optional `X-OpenRouter-Key` header. Supports `AbortSignal` |
| `/stt` | POST | `stt(audioBlob, lang)` | Speech-to-text. Sends webm audio blob as FormData |
| `/validate-key` | POST | `validateKey(key)` | Validates OpenRouter API key format |
| `/models` | GET | `getModels(key)` | Fetches available models from OpenRouter. Optional key header |

### 7.7 State Management
**Hybrid approach — no external state library:**

1. **`useReducer`** in `Home.jsx` — Central state machine:
   - States: `IDLE` → `INPUT_READY` → `LOADING` → `OUTPUT` / `ERROR`
   - Actions: `INPUT_CHANGED`, `LOADING`, `SUCCESS`, `ERROR`, `OUTPUT_EDIT`, `CLEAR_INPUT`, `RESET`, `FULL_RESET`

2. **`useState`** — Local component state (dropdowns, modals, toggles, forms)

3. **React Context** — Cross-cutting concerns (theme, user, incognito, session)

4. **`localStorage`** — Persistent storage for: API key (AES-256-GCM encrypted), model, theme, pinned history (max 10), feedback (max 100), token analytics (max 500), onboarding flag

5. **In-memory** — Session history (max 5 items, cleared on refresh, respects incognito)

### 7.8 Services & Utilities
| File | Purpose |
|------|---------|
| `services/crypto.js` | AES-256-GCM encryption/decryption via Web Crypto API (PBKDF2, 100K iterations, origin-aware salt) |
| `services/clipboard.js` | `copyToClipboard` with `navigator.clipboard` + `execCommand` fallback |
| `services/historyService.js` | `appendHistoryItem` with incognito guard + `HISTORY_LIMIT` enforcement |

### 7.9 Configuration
**`src/config/constants.js`** — All application constants:
- `API_BASE` from `VITE_API_BASE` env var (default: `http://localhost:8000`)
- Timeouts: `ENHANCE_TIMEOUT_MS` = 20s, `STT_TIMEOUT_MS` = 15s
- Limits: `MAX_INPUT_CHARS` = 512, `MAX_PINNED` = 10, `HISTORY_LIMIT` = 5, `FEEDBACK_CAP` = 100
- Dropdown options: `STYLES` (8), `TONES` (5), `LEVELS` (9), `LANGS`/`OUT_LANGS`
- `THEMES` — 7 theme definitions (brand, orange, carrot, blue, teal, brown, dusk)
- `estimateTokens()` — Rough heuristic: `ceil(text.length / 4)`

**`src/config/config.js`** — Feature flags:
- `SHOW_CHOTA_CHAT` = false (gates ChotaChatButton)
- `SHOWBACKENDSTATUSBAR` = false (gates StatusBanner)
- `APP_NAME` = 'Chota Packet'

### 7.10 Key Dependencies
- **Runtime**: `react` 19, `react-dom` 19, `react-router-dom` 7, `axios`, `diff-match-patch`, `lucide-react`
- **Dev**: `vite` 7, `tailwindcss` 4, `@tailwindcss/vite`, `vitest`, `happy-dom`, `jsdom`, `@testing-library/react`

### 7.11 Data Flow Summary
```
User types in InputArea → useReducer updates (INPUT_CHANGED) → state: INPUT_READY
User clicks Enhance → useEnhance.run() → POST /enhance → state: LOADING
Backend responds → useReducer SUCCESS → state: OUTPUT → OutputCard renders
User can: edit output, copy, "Take it to" AI sites, give feedback, regenerate, clear
```

---

## 7. Frontend Summary

### 7.1 Application Overview
Chota Packet is a **single-page application** — the entire app lives on one route (`/`) rendered by `Home.jsx`. `react-router-dom` is installed but only provides `BrowserRouter` wrapping. There are no dynamic routes, nested routes, or programmatic navigation.

### 7.2 Pages
| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `pages/Home.jsx` | Entire application: prompt input, enhancement controls, output display, sidebar, all modals |

### 7.3 Context Providers (nesting order: outer → inner)
| Provider | File | Purpose |
|----------|------|---------|
| `ThemeProvider` | `context/ThemeContext.jsx` | Mode (`light`/`dark`/`system`) + 7 color palettes. Persists to localStorage. Listens for system color scheme changes. |
| `UserProvider` | `context/UserContext.jsx` | Mock user placeholder (`Guest User`). Prepares for future auth. |
| `IncognitoProvider` | `context/IncognitoContext.jsx` | Boolean toggle — when active, history is not saved. |
| `SessionProvider` | `context/Session/` | Provides `resetSession` for starting fresh threads. |

### 7.4 Custom Hooks
| Hook | File | Purpose |
|------|------|---------|
| `useSettings` | `hooks/useSettings.js` | API key (encrypted), model selection, auto-fallback to free model, inference mode (`cloud` vs `local`), key validation |
| `useEnhance` | `hooks/useEnhance.js` | Wraps `/enhance` API call with `AbortController`. Cancels previous requests automatically. Returns `{ run, abort }` |
| `useRecorder` | `hooks/useRecorder.js` | Microphone lifecycle: permission, MediaRecorder, auto-stop timeout, STT API call, cleanup on unmount |
| `usePinned` | `hooks/usePinned.js` | Pinned history items with localStorage persistence, debounced writes (300ms), deduplication, MAX_PINNED cap |
| `useMediaQuery` | `hooks/useMediaQuery.js` | Reactive CSS media query listener. SSR-safe. Returns boolean |
| `useTokenAnalytics` | `hooks/useTokenAnalytics.js` | Tracks enhancement stats: tokens in/out, cost estimation ($0.003/1K), efficiency score (0-100), letter grade (A+ to F) |
| `useAutoSettings` | `hooks/useAutoSettings.js` | **LEGACY/UNUSED** — superseded by `useSettings.js` + `crypto.js` |

### 7.5 Component Architecture
**Core** (`components/core/`): Main functional UI
- `InputArea` — Auto-resizing textarea, char counter, over-limit warning, clear button, children slot (MicButton)
- `ControlBar` — Style/Tone/Level/Output dropdowns, Enhance button with spinner, inline ModelPill, Regenerate button
- `OutputCard` — Editable enhanced output, copy, "Take it to" dropdown (10 AI sites), word/char count, FeedbackBar, clear
- `DiffView` — Side-by-side semantic diff using `diff-match-patch` (green added, red removed)

**Layout** (`components/layout/`): Structural shell
- `Sidebar/` — Collapsible sidebar with its own `SidebarContext`. Contains: NewThreadButton, ChotaChatButton (feature-flagged), HistorySection, IncognitoToggle, SettingsMenu, UserButton, UserMenu, AppearancePanel
- `NavBar/` — NavBtn, KbdHint, ModeIndicator (Cloud/Local badge)

**Modals** (`components/modals/`):
- `SettingsModal` — API key management (save/clear/validate), inference mode display, model selector, shortcuts link
- `ShortcutsModal` — 20+ keyboard shortcuts reference in 4 groups
- `OnboardingOverlay` — First-time welcome, persists `LS_ONBOARDED` flag

**UI** (`components/ui/`):
- `MicButton` — Voice input with recording state, error display, spinner
- `StatusBanner` — Backend connection indicator (ok/loading/error), dismissible
- `FeedbackBar` — Thumbs up/down, persisted to localStorage (capped at 100)
- `TokensAnalytics` — Stats display: tokens saved, cost saved, prompts improved, efficiency grade
- `ErrorBoundary` — Class component, glassmorphic error card, dev-only error detail
- `icons.jsx` — 30+ SVG icons including AI brand logos (Claude, Perplexity, Grok, DeepSeek, Mistral, Sarvam AI, AI Fiesta)

### 7.6 API Integration (`services/api.js`)
All API calls use **Axios** with `baseURL: API_BASE` and `timeout: 20000ms`:

| Endpoint | Method | Function | Purpose |
|----------|--------|----------|---------|
| `/health` | GET | `health()` | Backend connectivity check on mount (5s timeout) |
| `/enhance` | POST | `enhance(payload, key, signal)` | Core prompt enhancement. Optional `X-OpenRouter-Key` header. Supports `AbortSignal` |
| `/stt` | POST | `stt(audioBlob, lang)` | Speech-to-text. Sends webm audio blob as FormData |
| `/validate-key` | POST | `validateKey(key)` | Validates OpenRouter API key format |
| `/models` | GET | `getModels(key)` | Fetches available models from OpenRouter. Optional key header |

### 7.7 State Management
**Hybrid approach — no external state library:**

1. **`useReducer`** in `Home.jsx` — Central state machine:
   - States: `IDLE` → `INPUT_READY` → `LOADING` → `OUTPUT` / `ERROR`
   - Actions: `INPUT_CHANGED`, `LOADING`, `SUCCESS`, `ERROR`, `OUTPUT_EDIT`, `CLEAR_INPUT`, `RESET`, `FULL_RESET`

2. **`useState`** — Local component state (dropdowns, modals, toggles, forms)

3. **React Context** — Cross-cutting concerns (theme, user, incognito, session)

4. **`localStorage`** — Persistent storage for: API key (AES-256-GCM encrypted), model, theme, pinned history (max 10), feedback (max 100), token analytics (max 500), onboarding flag

5. **In-memory** — Session history (max 5 items, cleared on refresh, respects incognito)

### 7.8 Services & Utilities
| File | Purpose |
|------|---------|
| `services/crypto.js` | AES-256-GCM encryption/decryption via Web Crypto API (PBKDF2, 100K iterations, origin-aware salt) |
| `services/clipboard.js` | `copyToClipboard` with `navigator.clipboard` + `execCommand` fallback |
| `services/historyService.js` | `appendHistoryItem` with incognito guard + `HISTORY_LIMIT` enforcement |

### 7.9 Configuration
**`src/config/constants.js`** — All application constants:
- `API_BASE` from `VITE_API_BASE` env var (default: `http://localhost:8000`)
- Timeouts: `ENHANCE_TIMEOUT_MS` = 20s, `STT_TIMEOUT_MS` = 15s
- Limits: `MAX_INPUT_CHARS` = 512, `MAX_PINNED` = 10, `HISTORY_LIMIT` = 5, `FEEDBACK_CAP` = 100
- Dropdown options: `STYLES` (8), `TONES` (5), `LEVELS` (9), `LANGS`/`OUT_LANGS`
- `THEMES` — 7 theme definitions (brand, orange, carrot, blue, teal, brown, dusk)
- `estimateTokens()` — Rough heuristic: `ceil(text.length / 4)`

**`src/config/config.js`** — Feature flags:
- `SHOW_CHOTA_CHAT` = false (gates ChotaChatButton)
- `SHOWBACKENDSTATUSBAR` = false (gates StatusBanner)
- `APP_NAME` = 'Chota Packet'

### 7.10 Key Dependencies
- **Runtime**: `react` 19, `react-dom` 19, `react-router-dom` 7, `axios`, `diff-match-patch`, `lucide-react`
- **Dev**: `vite` 7, `tailwindcss` 4, `@tailwindcss/vite`, `vitest`, `happy-dom`, `jsdom`, `@testing-library/react`

### 7.11 Data Flow Summary
```
User types in InputArea → useReducer updates (INPUT_CHANGED) → state: INPUT_READY
User clicks Enhance → useEnhance.run() → POST /enhance → state: LOADING
Backend responds → useReducer SUCCESS → state: OUTPUT → OutputCard renders
User can: edit output, copy, "Take it to" AI sites, give feedback, regenerate, clear
```
