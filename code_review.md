# Code Review — Chota Packet
> Reviewed: 2026-03-06  |  Scope: full codebase (backend + frontend)

---

## Overall Assessment

The codebase is **well-structured and clearly thought through**. The dual-mode (mock/real) pattern, reducer-based UI state machine, and backend proxy for API keys are all sound architectural decisions. The main concerns are around two real bugs, a few security/reliability gaps, and some consistency issues.

---

## 🔴 Critical (Bugs / Security)

### 1. [crypto.js](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/services/crypto.js) — Static salt makes AES-256-GCM equivalent to Caesar cipher
**File:** [frontend/src/services/crypto.js](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/services/crypto.js) L5–L17

The PBKDF2 key is derived purely from a hardcoded salt (`chota-packet-salt-v1`) with no user-specific secret. Because the salt is the **only input** to [deriveKey()](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/services/crypto.js#8-18), every user running this app gets the **same encryption key**. Anyone who opens DevTools can reproduce it. The comment says "the goal is obfuscation" — that is fine, but the current setup provides *no* obfuscation if the attacker knows the source.

**Fix:** Add a per-device random material stored separately, or at minimum use the machine's crypto fingerprint as an additional input. Even `location.origin` XOR'd in gives marginal improvement over nothing. Alternatively, document this as intentionally weak and remove the "AES-256-GCM" claim from the UI note at `SettingsModal.jsx:181`.

---

### 2. [routes.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/routes.py) — Bare `except Exception: pass` silently drops live OpenRouter errors
**File:** [backend/routes.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/routes.py) L427–L428

```python
except Exception:
    pass  # Fall through to static list
```

This catches network errors, auth errors, and even internal bugs in the 200-path parsing, silently falling back to statics. A `401` from OpenRouter (bad key) will appear as a successful fetch of the static model list. Users won't know their key is being rejected.

**Fix:**
```python
except (httpx.TimeoutException, httpx.RequestError) as exc:
    logger.warning("Live model fetch failed (%s) — using static fallback", exc)
```
Only catch network-level failures, not all exceptions.

---

### 3. [routes.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/routes.py) — `import re` inside a request handler path
**File:** [backend/routes.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/routes.py) L338

```python
import re as _re
```

Importing inside a hot path is a Python anti-pattern (CPython does cache it after first import, but it is still unconventional and misleading). Move it to the top of the file.

---

## 🟠 High (Reliability / UX correctness)

### 4. [constants.js](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/constants.js) — Style list disagrees with backend `STYLE_MAP`
**File:** [frontend/src/constants.js](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/constants.js) L9–L15  |  [backend/config.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/config.py) L57–L64

Frontend exposes `academic` and `marketing` styles. Backend `STYLE_MAP` has `stepbystep`, `code`, `creative`, `data`, `detailed`, `general` — `academic` and `marketing` are **absent**.

Consequence: selecting "Academic" or "Marketing" in the UI silently falls back to `general` on the backend (the validator logs a warning and returns `"general"`). The user sees a style label but gets generic output with no indication of the mismatch.

**Fix:** Either add the missing styles to `STYLE_MAP` in [config.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/config.py), or remove them from [constants.js](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/constants.js).

---

### 5. [App.jsx](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/App.jsx) — Error state is sticky when user retypes
**File:** [frontend/src/App.jsx](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/App.jsx) L20, L25

`INPUT_CHANGED` transitions to `INPUT_READY` but `ERROR` state is never cleared in the reducer on new input. So if an enhancement fails, the user starts typing and the error banner **remains visible** alongside the typing area.

**Fix:**
```js
case 'INPUT_CHANGED': return { ...state, input: action.value, uiState: action.value.trim() ? 'INPUT_READY' : 'IDLE', error: null }
```
Or reset `uiState` to `IDLE` / `INPUT_READY` explicitly when transitioning away from `ERROR`.

---

### 6. [useSettings.js](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/hooks/useSettings.js) — `inferenceMode` computed without `selectedModel` check
**File:** [frontend/src/hooks/useSettings.js](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/hooks/useSettings.js) L70

```js
inferenceMode: openRouterKey ? 'cloud' : 'local',
```

A user can have a key saved but select "— Auto-select —" (empty `selectedModel`). In [App.jsx](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/App.jsx) L82, `model: selectedModel || undefined` sends `undefined`. In [routes.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/routes.py) L198, the condition is `req.model and req.model != "local"` — an absent [model](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/models.py#64-132) field falls through to local, correctly. But the UI badge says "☁ Cloud" even when local inference is actually used.

**Fix:** Compute `inferenceMode` as `openRouterKey && selectedModel ? 'cloud' : 'local'`, or be explicit in the badge label ("☁ Cloud (no model selected)" → "⚠ Cloud – select a model").

---

## 🟡 Medium (Code quality / Maintainability)

### 7. [SettingsModal.jsx](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/components/SettingsModal.jsx) — Inference mode section is disabled but appears interactive
**File:** [frontend/src/components/SettingsModal.jsx](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/components/SettingsModal.jsx) L70

Both mode buttons have `disabled` attribute, rendering them visually as toggles but non-functional. This is confusing UX — if the mode is auto-derived from whether a key is present, the section should say "Mode is determined by your API key" rather than showing fake toggle buttons.

---

### 8. [models.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/models.py) — [build_prefix](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/models.py#164-208) receives `lang` and `input_lang` as separate identical params
**File:** [backend/models.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/models.py) L164–L171

```python
def build_prefix(lang, style, tone, enhancement_level, input_lang="en", output_lang="auto"):
```

Both `lang` and `input_lang` are passed, and both are set to `req.input_lang` at the callsite ([routes.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/routes.py) L188–194). `lang` is used to select `TASK_PREFIXES`; `input_lang` is used for the cross-lingual tag. They always have the same value. Remove the redundant parameter.

---

### 9. [HistoryPanel.jsx](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/components/HistoryPanel.jsx) — [usePinned](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/components/HistoryPanel.jsx#4-28) hook defined in component file
**File:** [frontend/src/components/HistoryPanel.jsx](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/components/HistoryPanel.jsx) L4–L27

[usePinned](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/components/HistoryPanel.jsx#4-28) is a non-trivial hook (state + localStorage I/O + two callbacks). It belongs in `hooks/usePinned.js`, not inline in the component file. Inline hooks are harder to test and find.

---

### 10. [api.js](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/services/api.js) — `Content-Type: multipart/form-data` set manually with Axios FormData
**File:** [frontend/src/services/api.js](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/services/api.js) L19

```js
headers: { 'Content-Type': 'multipart/form-data' },
```

Setting `Content-Type` manually for `FormData` with Axios **breaks the boundary parameter** that Axios would otherwise auto-generate. Remove that header entirely; Axios handles it correctly when you pass a `FormData` body.

**This is a latent bug** — it may not break in all environments, but it can cause the server to reject the multipart body if the boundary is missing.

---

### 11. [routes.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/routes.py) — `ENHANCE_TIMEOUT_S` / `STT_TIMEOUT_S` defined in [config.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/config.py) but **not used** in backend
**File:** [backend/config.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/config.py) L36–L38

`ENHANCE_TIMEOUT_S` and `STT_TIMEOUT_S` are defined for documentation (they describe the *client-side* Axios timeouts, not backend logic). They are never used by [routes.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/routes.py). If they are not meant for backend use, they should be removed from [config.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/config.py) or clearly commented as "frontend reference only".

---

### 12. [HistoryPanel.jsx](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/components/HistoryPanel.jsx) — [exportItems](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/components/HistoryPanel.jsx#29-40) creates DOM element without appending to document
**File:** [frontend/src/components/HistoryPanel.jsx](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/components/HistoryPanel.jsx) L34–L38

```js
const a = document.createElement('a')
a.href = URL.createObjectURL(blob)
a.download = `chota-history.${format}`
a.click()
```

Calling `.click()` on a detached element works in Chrome but is **not guaranteed** in all browsers (Firefox historically required the element to be in the document). Add `document.body.appendChild(a)` before click and remove it after.

---

## 🔵 Low (Polish / Minor)

### 13. [index.css](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/index.css) — `diff-added` / `diff-removed` use hard-coded dark colors
**File:** [frontend/src/index.css](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/index.css) L310–L322

These classes use `#166534` (dark green) and `#7f1d1d` (dark red) directly, with no theme variable. In light mode, both colours will be nearly invisible against the white background.

**Fix:** Add theme-aware versions:
```css
.diff-added { background-color: var(--diff-added-bg, #166534); color: var(--diff-added-text, #bbf7d0); }
```
And override in `.light { --diff-added-bg: #dcfce7; --diff-added-text: #166534; }`.

---

### 14. [App.jsx](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/App.jsx) — [NavBtn](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/App.jsx#232-246) and [KbdHint](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/App.jsx#247-258) components defined at bottom of App file
**File:** [frontend/src/App.jsx](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/App.jsx) L233–L257

Both helpers are small but are not co-located with what they describe. If [App.jsx](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/App.jsx) grows, these become harder to find. Consider moving each to `components/` or to a `components/NavBar.jsx` file.

---

### 15. [routes.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/routes.py) — Cost estimate formula is labeled "rough" with incorrect rationale
**File:** [backend/routes.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/routes.py) L319–L320

```python
# Rough cost: most models ~$0.005 per 1k tokens blended
cost = round(total_tokens * 0.000005, 6)
```

`$0.000005 × 1000 = $0.005 per token`, not per 1k tokens. The correct math for "$0.005 per 1k tokens" is `total_tokens * 0.000005` — the code happens to be numerically correct but the comment is wrong. Fix the comment to read `$0.000005 per token ($5 per 1M tokens)`.

---

## Summary Table

| # | Severity | File | Issue |
|---|----------|------|-------|
| 1 | 🔴 Critical | [crypto.js](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/services/crypto.js) | Static-salt AES key; no real obfuscation |
| 2 | 🔴 Critical | [routes.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/routes.py) | Bare `except` swallows real errors in `/models` |
| 3 | 🔴 Critical | [routes.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/routes.py) | `import re` inside function body |
| 4 | 🟠 High | [constants.js](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/constants.js) + [config.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/config.py) | Style list mismatch frontend vs backend |
| 5 | 🟠 High | [App.jsx](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/App.jsx) | Error banner not cleared on new input |
| 6 | 🟠 High | [useSettings.js](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/hooks/useSettings.js) | `inferenceMode` badge misleads when no model selected |
| 7 | 🟡 Medium | [SettingsModal.jsx](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/components/SettingsModal.jsx) | Disabled toggle visually implies interactivity |
| 8 | 🟡 Medium | [models.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/models.py) | Redundant `lang` + `input_lang` params in [build_prefix](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/models.py#164-208) |
| 9 | 🟡 Medium | [HistoryPanel.jsx](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/components/HistoryPanel.jsx) | [usePinned](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/components/HistoryPanel.jsx#4-28) should be in its own hook file |
| 10 | 🟡 Medium | [api.js](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/services/api.js) | Manual `Content-Type` on FormData breaks boundary |
| 11 | 🟡 Medium | [config.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/config.py) | Client-side timeout constants clutter backend config |
| 12 | 🟡 Medium | [HistoryPanel.jsx](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/components/HistoryPanel.jsx) | `a.click()` on detached element — cross-browser issue |
| 13 | 🔵 Low | [index.css](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/index.css) | Diff colours not theme-aware (broken in light mode) |
| 14 | 🔵 Low | [App.jsx](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/App.jsx) | [NavBtn](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/App.jsx#232-246) / [KbdHint](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/App.jsx#247-258) helpers should be extracted |
| 15 | 🔵 Low | [routes.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/routes.py) | Cost comment says "per 1k tokens" but formula is per token |

---

## Positives worth keeping

- Reducer-based UI state machine in [App.jsx](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/App.jsx) is clean and correct.
- [ModelState](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/models.py#46-60) dataclass + lifespan pattern in [main.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/main.py) is idiomatic FastAPI.
- Backend proxy for the API key (never in the browser request) is the right call.
- Hallucination check with n-gram repetition is a thoughtful guard.
- [constants.js](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/constants.js) mirrors [config.py](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/backend/config.py) well (timeouts, input caps).
- [HistoryPanel](file:///c:/Users/PB-Abhay/Desktop/Work/Personal/Personal%20projects/Chota%20Packet/frontend/src/components/HistoryPanel.jsx#49-224) pinning + search + export in one component is solid feature density without being messy.
