# Software Requirements Specification (SRS)

> **Document Status:** Draft v2.0
> **Project Name:** Chota Packet - On-Device AI Prompt Enhancement Assistant
> **Prepared By:** Abhay Malav
> **Degree Program:** B.Tech Computer Science & Engineering, 8th Semester
> **Date:** February 2026
> **Change Summary:** 
> - Fixed FR numbering duplication (FR-11 through FR-20 corrected to FR-21 through FR-30)
> - Added FR-31 through FR-40: New UX/Feature enhancements (Editable Output, Regenerate, Cross-Lingual Output, User Feedback, Export History, Live Input Counter, Dark Mode, Keyboard Shortcuts, Settings Panel, Onboarding)
> - Updated F15-F24 in Product Features section
> - Added F25: OpenRouter API Key Integration — lets users supply their own OpenRouter API key and experiment with cloud-hosted models (GPT-4o, Claude, Gemini, Llama, etc.) as an alternative to the local mT5-small model
> - Added FR-41, FR-42: Functional requirements for API key management and cloud model inference
> - Updated NF-S, NF-P, NF-R sections with OpenRouter-related edge cases
> - Added R-11 through R-14: Risks for API key exposure, rate limiting, cost overrun, and cloud dependency

***

# 1. Introduction

## 1.1 Purpose

This Software Requirements Specification (SRS) defines the complete functional and non-functional requirements for **Chota Packet**, an on-device AI-powered prompt engineering assistant. The document is intended to guide the development, testing, and evaluation of the system. It serves as the primary reference for the developer during the implementation phase and as a deliverable for the academic evaluation committee.

## 1.2 Scope

Chota Packet is a locally-hosted web application that accepts rough text or voice input from a user and transforms it into a structured, high-quality prompt suitable for use with large language models (LLMs) such as ChatGPT, Gemini, and Claude. The system operates entirely offline on the user's local machine - no internet connection is required during runtime.

**The system includes:**
- A React-based web frontend accessible at `localhost:3000`
- A Python FastAPI backend running at `localhost:8000`
- A fine-tuned `mT5-small` model for prompt enhancement
- An `openai/whisper-tiny` model for speech-to-text transcription
- Bilingual support for Hindi and English

**The system explicitly excludes:**
- ~~Direct integration with any external LLM API (ChatGPT, Gemini, Claude)~~ **Updated in v2.0:** Optional integration with cloud-hosted LLMs is now supported via OpenRouter when the user supplies their own API key. See F25, FR-41, FR-42.
- Cloud-based inference or remote model hosting **as the default or required mode** — the local mT5-small model remains the primary, zero-cost, offline-first enhancement engine. Cloud inference via OpenRouter is strictly opt-in.
- User authentication or multi-user session management
- Mobile native app packaging (iOS/Android)
- Any form of prompt history storage or database persistence beyond localStorage for pinned prompts

## 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|---|---|
| **LLM** | Large Language Model - a large-scale AI model such as GPT-4, Gemini, or Claude |
| **Edge AI** | AI inference performed locally on the end-user's device without cloud dependency |
| **Prompt** | A natural language instruction or query provided to an LLM to produce a desired output |
| **Prompt Enhancement** | The process of transforming a vague or incomplete prompt into a well-structured, specific, and contextually rich instruction |
| **mT5-small** | Multilingual Text-to-Text Transfer Transformer (small variant) by Google - a seq2seq model pre-trained on 101 languages |
| **LoRA** | Low-Rank Adaptation - a parameter-efficient fine-tuning technique that trains only a small adapter on top of a frozen base model |
| **PEFT** | Parameter-Efficient Fine-Tuning - HuggingFace library implementing LoRA and related methods |
| **Whisper Tiny** | OpenAI's smallest speech recognition model (~39MB), supporting multilingual transcription |
| **STT** | Speech-to-Text - the process of converting spoken audio into written text |
| **Seq2Seq** | Sequence-to-Sequence - a model architecture that maps one text sequence to another |
| **Beam Search** | A decoding strategy that explores multiple output candidates simultaneously to improve generation quality |
| **ROUGE-L** | Recall-Oriented Understudy for Gisting Evaluation - used to measure the quality of generated text against reference output |
| **CORS** | Cross-Origin Resource Sharing - a browser security mechanism controlling cross-origin HTTP requests |
| **WAV** | Waveform Audio File Format - uncompressed audio format required by Whisper for processing |
| **FastAPI** | A modern, async Python web framework used to expose ML models as REST APIs |
| **React** | A JavaScript library for building user interfaces, used for the Chota Packet frontend |
| **Well-formed Input** | An input string of at least 3 characters, containing at least one meaningful word (non-punctuation, non-whitespace token), and expressing a coherent intent. Used as the baseline population for NF-R1/NF-R2. |
| **Rough Input** | A short, vague, incomplete, or unstructured natural language string representing the user's initial idea before enhancement. May be a fragment, keyword list, or grammatically incomplete sentence. |
| **Script Normalization** | A post-processing step applied to Whisper output that detects whether transcribed text is in Devanagari, Roman-script Hindi (Hinglish), or English, and passes the detected script and language tag to the enhancement model. Implemented via Unicode character range detection (U+0900–U+097F for Devanagari). |
| **Transliterated Hindi** | Hindi language written in Roman script (e.g., "meri dukaan ke liye website banao"). Supported as STT output from Whisper Tiny and as direct text input. The enhancement model must handle this as a valid input format. |
| **Task Prefix** | A string prepended to user input before tokenization to signal the desired behavior to the mT5-small model. Values: "enhance prompt: " (English), "prompt sudharo: " (Hindi). Must match prefixes used during fine-tuning exactly (case and whitespace). |

## 1.4 Document Overview

- **Section 2** describes the overall product context, user classes, and constraints
- **Section 3** defines all functional requirements with input/process/output specifications
- **Section 4** defines non-functional requirements covering performance, reliability, portability, and security
- **Section 5** describes the system models including use cases and data flow
- **Section 6** provides the appendix with the technology stack and references

***

# 2. Overall Description

## 2.1 Product Perspective

Chota Packet is a standalone, self-contained application. It does not depend on any external service or internet connectivity during operation. It sits as a local middleware layer between the user's raw thinking and the input interface of a commercial LLM - bridging the gap between rough ideas and professionally structured prompts.

```
[User's Raw Idea] → [Chota Packet (Local)] → [Polished Prompt] → [ChatGPT / Gemini / Claude]
```

The system is novel in its edge-first design philosophy: rather than sending user data to a cloud service for processing, all ML inference is performed on the user's own hardware using locally stored model weights. This directly addresses privacy concerns associated with submitting sensitive ideas or drafts to cloud-based AI systems.

## 2.2 Product Features

The following is a high-level summary of Chota Packet's core features:

- **F1 - Text-Based Prompt Enhancement:** Accept raw text input and return a structured, high-quality prompt
- **F2 - Voice-to-Text Transcription:** Record voice input, transcribe using Whisper Tiny, and populate the text input field
- **F3 - Bilingual Support:** Process inputs in Hindi (Devanagari and transliterated) and English
- **F4 - Language Selection:** User-controlled toggle to specify input language (Hindi / English)
- **F5 - One-Click Copy:** Copy the enhanced prompt to the system clipboard with a single button
- **F6 - Offline Operation:** All inference runs locally with no internet dependency at runtime
- **F7 - Editable Transcription:** Transcribed voice text is placed in an editable field before enhancement - not auto-submitted
- **F8 - Prompt Style Selector:** User-selectable enhancement direction (Code, Creative, Step-by-Step, etc.)
- **F9 - Session History Panel:** Last 5 enhancements accessible in-memory during the session
- **F10 - Before/After Diff View:** Visual word-level diff between input and enhanced output
- **F11 - Tone Selector:** Formal / Casual / Technical tone modifier for enhancement output
- **F12 - Favorite / Pin a Prompt:** User-pinned prompts persisted to localStorage across sessions
- **F13 - Token Count Indicator:** Approximate token count and context window usage bar on output
- **F14 - Enhancement Level Selector:** Dropdown control (Basic / Detailed / Advanced) that directs the backend to use a tailored system prompt for that enhancement depth, placed adjacent to the Send button in the UI
- **F15 - Editable Output Card:** User can directly edit the enhanced prompt before copying
- **F16 - Regenerate / Multiple Variants:** Generate new variations of the same input with one click
- **F17 - Cross-Lingual Output Mode:** Write input in one language, receive enhanced output in another
- **F18 - User Feedback on Output:** Thumbs up/down rating mechanism on enhanced prompts
- **F19 - Export History:** Download session/pinned history as JSON or TXT file
- **F20 - Live Input Character Counter:** Real-time character/word count on input field
- **F21 - Dark Mode Toggle:** User-selectable dark/light theme with persistence
- **F22 - Keyboard Shortcuts:** Ctrl+Enter to enhance, Escape to cancel, Ctrl+Shift+C to copy
- **F23 - Settings Panel:** Persistent user preferences (default language, enhancement level, theme)
- **F24 - First-Run Onboarding:** Interactive tooltip walkthrough for new users
- **F25 - OpenRouter API Key Integration:** User can enter their own OpenRouter API key to route prompt enhancement through cloud-hosted LLMs (GPT-4o, Claude 3.5, Gemini 1.5, Llama 3, Mistral, etc.) instead of the local mT5-small model. Includes model selector, key validation, usage cost awareness, and automatic fallback to local model on failure.

## 2.3 User Classes and Characteristics

Chota Packet is designed for a single primary user class:

**Primary User - General LLM User (Technical or Non-Technical)**
- A person who regularly uses LLMs (ChatGPT, Gemini, Claude) but struggles to write effective prompts
- May be a student, researcher, content creator, developer, or professional
- Comfortable using a web browser; no programming knowledge required
- May prefer to communicate in Hindi, English, or a mix of both
- Operates on consumer-grade hardware (old laptops, personal computers) with at minimum 4GB RAM

No admin panel, no user accounts, no role-based access - this is a single-user local tool.

## 2.4 Operating Environment

| Component | Minimum Requirement |
|---|---|
| OS | Windows 10, macOS 11, or Ubuntu 20.04 |
| RAM | 4 GB (6 GB recommended) |
| Storage | 3 GB free (for model weights + dependencies) |
| Python | 3.9 or above |
| Node.js | 18.x or above |
| Browser | Chrome 110+, Firefox 115+, Edge 110+ |
| Microphone | Required only for voice input feature |
| Internet | Required only for first-time setup and model downloads |

## 2.5 Design and Implementation Constraints

- **C1** - The system must operate without any internet connection after initial setup **for local model inference**. When the user opts into OpenRouter cloud inference (F25), an active internet connection is required for those requests only; all other features remain fully offline.
- **C2** - Total RAM usage of the backend (both models loaded simultaneously) must not exceed 2.5 GB
- **C3** - The project must be completable by a single developer within 3 weeks
- **C4** - All components must use open-source, freely licensed libraries
- **C5** - The mT5-small base model must be fine-tuned using LoRA (not full fine-tuning) to remain compatible with free-tier GPU training (Google Colab T4)
- **C6** - Training data must consist of a minimum of 400 manually curated or synthetically generated prompt pairs in Hindi and English

## 2.6 Assumptions and Dependencies

- **A1** - The user's machine has Python 3.9+ and Node.js 18+ installed prior to setup
- **A2** - Model weights (`mT5-small` base + LoRA adapter, `whisper-tiny`) are downloaded once during setup and stored locally
- **A3** - The React frontend and FastAPI backend run simultaneously on the same machine
- **A4** - Audio captured by the browser is in WebM or OGG format and will be converted server-side before Whisper processing
- **A5** - The fine-tuned LoRA adapter was trained on a dataset that includes both Hindi (Devanagari) and English prompt pairs with consistent task prefixes (`"enhance prompt:"` for English, `"prompt sudharo:"` for Hindi)
- **A6** - CORS is configured to allow only `localhost:3000` as an allowed origin for all API requests

***

# 3. Functional Requirements

### FR-01 - Text Input Acceptance

**Feature:** F1 - Text-Based Prompt Enhancement
**Priority:** High

| | Description |
|---|---|
| **Input** | A raw, unstructured text string entered by the user in the text input field. May be in English, Hindi (Devanagari), or transliterated Hindi. Maximum length: 512 characters. |
| **Process** | The frontend sends the text and the selected language parameter to `POST /enhance` on the FastAPI backend via an Axios HTTP request |
| **Output** | The text is available in the backend for processing by FR-06 |

**Validation:**

- Text input must not be empty (frontend enforces this before sending)
- Input exceeding 512 characters must be truncated with a user-visible warning

***

### FR-02 - Language Selection Toggle

**Feature:** F4 - Language Selection
**Priority:** High

| | Description |
|---|---|
| **Input** | User clicks the language toggle button in the UI, switching between "Hindi" and "English" |
| **Process** | React `useState` stores the selected language as `"hi"` or `"en"`. This value is passed as a parameter in all API calls to `/stt` and `/enhance` |
| **Output** | The selected language is visually indicated in the UI. All subsequent API calls use this value. |

**Default state:** English (`"en"`)

***

### FR-03 - Voice Recording and Submission

**Feature:** F2 - Voice-to-Text Transcription
**Priority:** High

| | Description |
|---|---|
| **Input** | User clicks the microphone button; browser prompts for microphone permission if not already granted. User speaks their rough idea. User clicks the button again to stop recording. |
| **Process** | `MediaRecorder` API captures audio as a WebM/OGG Blob. On recording stop, React sends the Blob as `multipart/form-data` along with the selected language parameter to `POST /stt` |
| **Output** | A loading indicator is shown while the request is in-flight |

**Constraints:**

- Maximum recording duration: 60 seconds (enforced by a frontend timer)
- If microphone permission is denied, display a clear error message: *"Microphone access is required for voice input"*

***

### FR-04 - Speech-to-Text Transcription

**Feature:** F2 - Voice-to-Text Transcription
**Priority:** High

| | Description |
|---|---|
| **Input** | Audio file (WebM/OGG) received by `POST /stt` endpoint, along with `lang` parameter (`"hi"` or `"en"`) |
| **Process** | 1. Convert audio to 16kHz mono WAV using `soundfile`/`librosa`. 2. Extract mel spectrogram features using `WhisperProcessor`. 3. Run `WhisperForConditionalGeneration.generate()` with `forced_decoder_ids` set based on `lang` parameter. 4. Decode token IDs to string. 5. Run script normalization (check for Romanized Hindi, flag or pass-through). |
| **Output** | JSON response: `{ "text": "transcribed string" }` returned to the React frontend, which populates the editable text input field |

**Error handling:** If audio is silent or below a noise threshold, return `{ "text": "", "warning": "No speech detected" }`

***

### FR-05 - Editable Transcription Review

**Feature:** F7 - Editable Transcription
**Priority:** Medium

| | Description |
|---|---|
| **Input** | Transcribed text returned from `/stt` endpoint |
| **Process** | The transcribed text is placed into the same text input box used for manual entry. The user may edit, correct, or extend the text before submitting for enhancement. |
| **Output** | User-reviewed and optionally modified text ready for submission to `/enhance` |

**Rationale:** This step is critical for Hindi voice input where Whisper Tiny may mishear domain-specific words or produce partially transliterated output.

***

### FR-06 - Prompt Enhancement

**Feature:** F1 - Text-Based Prompt Enhancement
**Priority:** High

| | Description |
|---|---|
| **Input** | JSON body received at `POST /enhance`: `{ "text": "<user input>", "lang": "hi" or "en" }` |
| **Process** | 1. Prepend task prefix: `"enhance prompt: "` (English) or `"prompt sudharo: "` (Hindi). 2. Tokenize the prefixed string using `mT5Tokenizer` with `max_length=128`, `truncation=True`. 3. Run `mT5ForConditionalGeneration.generate()` with `num_beams=4`, `max_new_tokens=200`, `early_stopping=True`. 4. Decode output token IDs. 5. Strip special tokens (`<pad>`, `</s>`). 6. Strip excess whitespace. |
| **Output** | JSON response: `{ "enhanced_prompt": "<structured prompt string>" }` |

**Error handling:** If the model returns an empty or malformed string, return a fallback message: `{ "error": "Enhancement failed. Please try again or rephrase your input." }`

***

### FR-07 - Enhanced Prompt Display

**Feature:** F1, F5, F15
**Priority:** High

| | Description |
|---|---|
| **Input** | `enhanced_prompt` string from `/enhance` API response |
| **Process** | React renders the enhanced prompt in a display card. The output is rendered in a `contenteditable` div or textarea, allowing direct editing by the user before copying. |
| **Output** | The enhanced prompt is displayed with inline edit capability and a visible "Copy to Clipboard" button |

**Note:** Output is editable by default (F15). Changes are local only - not sent back to backend.

***

### FR-08 - Copy to Clipboard

**Feature:** F5 - One-Click Copy
**Priority:** Medium

| | Description |
|---|---|
| **Input** | User clicks the "Copy to Clipboard" button below the enhanced prompt output |
| **Process** | React calls the browser `navigator.clipboard.writeText()` API with the enhanced prompt string (including any user edits) |
| **Output** | The button label changes to "Copied ✓" for 2 seconds, then reverts. The full enhanced prompt is now in the user's clipboard, ready to paste into ChatGPT, Gemini, or Claude. |

***

### FR-09 - Model Initialization at Server Startup

**Feature:** F6 - Offline Operation
**Priority:** High

| | Description |
|---|---|
| **Input** | FastAPI server start command (`uvicorn main:app`) |
| **Process** | FastAPI `lifespan` context manager loads both models into memory: (1) Whisper Tiny processor + model, (2) mT5-small tokenizer + base model + LoRA adapter merged weights. All loaded to CPU with `torch_dtype=torch.float16`. |
| **Output** | Both models are stored in `app.state` and available for all subsequent requests with zero additional loading time |

**Startup time expectation:** 20–40 seconds on first boot. This is a one-time cost per session.

***

### FR-10 - Fine-Tuning Pipeline (Offline / Development Phase)

**Feature:** Core ML capability
**Priority:** High (development-phase requirement)

| | Description |
|---|---|
| **Input** | `dataset.json` containing minimum 400 `(rough_input, enhanced_output)` pairs in Hindi and English, with task prefixes prepended to inputs |
| **Process** | 1. Load `google/mt5-small` base model. 2. Apply LoRA config via `peft` (target modules: `["q", "v"]`, `r=16`, `lora_alpha=32`). 3. Tokenize all pairs. 4. Train using HuggingFace `Seq2SeqTrainer` for 10–15 epochs (batch size 8, lr 3e-4) on Google Colab T4 GPU. 5. Evaluate on validation set using ROUGE-L score. 6. Save LoRA adapter weights. |
| **Output** | LoRA adapter files (`adapter_config.json`, `adapter_model.bin`) saved to `training/output/` and copied to `backend/models/` for runtime use |

***

### FR-11 - Reset / New Prompt Action

**Feature:** F8 - Session Reset
**Priority:** Medium

| | Description |
|---|---|
| **Input** | User clicks a "New Prompt" or "Start Over" button visible in the OUTPUT or ERROR states |
| **Process** | React clears the text input field, clears the output card, resets the UI state machine to IDLE, and resets any error messages. Language toggle retains its current value (not reset). |
| **Output** | The application returns to IDLE state with empty input and output fields. No API call is made. |

**Validation:**

- Button must only be visible in OUTPUT or ERROR states (not IDLE).

***

### FR-12 - Minimum Input Validation

**Feature:** F1 - Text-Based Prompt Enhancement
**Priority:** High

| | Description |
|---|---|
| **Input** | Text submitted to the "Enhance" button |
| **Process** | Frontend validates: (1) input is not empty after trimming whitespace, (2) input is at least 3 characters long, (3) input is not composed entirely of punctuation or non-alphanumeric characters. Validation runs before any API call is dispatched. |
| **Output** | If validation fails, display inline error: "Please enter a meaningful prompt (at least 3 characters)." The Enhance button remains disabled until criteria are met. |

***

### FR-13 - Backend Connectivity Check on Load

**Feature:** F6 - Offline Operation
**Priority:** High

| | Description |
|---|---|
| **Input** | React app mounts at localhost:3000 |
| **Process** | On componentDidMount / useEffect, React calls GET /health. If response is { "status": "ok", "models_loaded": true }, the UI renders in IDLE state. If the call fails (network error, timeout > 5s, or models_loaded: false), the UI renders a full-page status banner. |
| **Output** | **Success:** Normal IDLE state, no user-visible message. <br> **Failure:** Banner displays "Backend not ready. Please start the FastAPI server (uvicorn main:app) and refresh this page." with a "Retry" button that re-calls /health. |

**Validation:**

- `/health` response must be received within 5 seconds; otherwise treat as failure.

***

### FR-14 - API Request Timeout Handling

**Feature:** F1, F2
**Priority:** High

| | Description |
|---|---|
| **Input** | Any in-flight Axios request to /enhance or /stt |
| **Process** | Axios is configured with a timeout of 15,000ms for /enhance and 12,000ms for /stt. If the timeout expires before a response is received, Axios cancels the request. |
| **Output** | UI transitions from LOADING to ERROR state. Error message displayed: "Request timed out. The model may still be loading — please wait 30 seconds and try again." |

**Dependency:**

- Requires AbortController or Axios CancelToken support.

***

### FR-15 - Audio File Size Validation (Backend)

**Feature:** F2 - Voice-to-Text Transcription
**Priority:** Medium

| | Description |
|---|---|
| **Input** | Audio file received at POST /stt as multipart/form-data |
| **Process** | Backend validates: (1) file size must not exceed 10MB, (2) MIME type must be audio/webm, audio/ogg, or audio/wav. Validation occurs before any audio processing. |
| **Output** | If validation fails: HTTP 400 with JSON body `{ "error": "Invalid audio file", "detail": "reason" }`. If valid: processing continues per FR-04. |

**Rationale:**

- Prevents memory exhaustion from malformed or oversized uploads.
- FastAPI body size limit must be configured via `app = FastAPI()` with `max_upload_size` parameter or a Starlette middleware.

***

### FR-16 - Repetition / Hallucination Detection

**Feature:** F1 - Text-Based Prompt Enhancement
**Priority:** Medium

| | Description |
|---|---|
| **Input** | Decoded output string from mT5-small generation |
| **Process** | Backend applies a post-processing check: (1) If output length < 15 tokens after stripping special tokens, flag as "too short." (2) If any 4-gram appears more than 3 times in the output, flag as "repetitive hallucination." Either condition triggers the fallback response. |
| **Output** | **Fallback:** `{ "error": "Enhancement failed. Please rephrase your input and try again." }` <br> **Normal:** `{ "enhanced_prompt": "string" }` |

**Implementation note:**

- Use `collections.Counter` on 4-gram windows of the decoded token list before detokenization.

***

### FR-17 - Recording State UI Indicator

**Feature:** F2 - Voice-to-Text Transcription
**Priority:** Medium

| | Description |
|---|---|
| **Input** | User clicks microphone button to begin recording |
| **Process** | React transitions UI to a distinct RECORDING state: (1) Microphone button changes appearance (e.g., pulsing red indicator). (2) A visible countdown timer shows remaining time (60s → 0s). (3) A "Cancel Recording" option is available, which stops the MediaRecorder and discards the audio blob without sending to /stt. |
| **Output** | RECORDING state is visually distinct from IDLE and LOADING. On stop: UI transitions to LOADING (STT in progress). |

**State machine addition:**
- IDLE → RECORDING → LOADING(STT) → IDLE(text populated)

***

### FR-18 - MediaRecorder Cleanup on Unmount

**Feature:** F2 - Voice-to-Text Transcription
**Priority:** High

| | Description |
|---|---|
| **Input** | React component unmounts while recording is in progress (e.g., user navigates away, closes tab) |
| **Process** | React useEffect cleanup function calls mediaRecorder.stop() and releases all MediaStream tracks via stream.getTracks().forEach(t => t.stop()). |
| **Output** | Microphone is released. No audio blob is sent to /stt. No memory leak occurs. Browser microphone indicator (red dot in tab) disappears. |

**Implementation:**

- Must be implemented in the `useEffect` return function.

***

### FR-19 - Model Load Failure Handling

**Feature:** F6 - Offline Operation
**Priority:** High

| | Description |
|---|---|
| **Input** | FastAPI server startup via uvicorn main:app |
| **Process** | Within the lifespan context manager, model loading is wrapped in try/except. On failure (FileNotFoundError, OSError, RuntimeError), the server logs a structured error to stderr and sets app.state.models_loaded = False. The /health endpoint returns { "status": "error", "models_loaded": false, "detail": "<error message>" }. /enhance and /stt return HTTP 503 with { "error": "Models not loaded. Check server logs." } |
| **Output** | Server starts but serves informative errors rather than crashing silently or hanging. |

***

### FR-20 - Progressive Recording Time Warning

**Feature:** F2 - Voice-to-Text Transcription
**Priority:** Low

| | Description |
|---|---|
| **Input** | Active recording session approaching 60-second limit |
| **Process** | When remaining time reaches 10 seconds, the countdown timer changes color to orange. At 5 seconds, it changes to red and the text displays "5s remaining - recording will stop automatically". |
| **Output** | User receives progressive visual warning before automatic cutoff, reducing surprise and incomplete recordings. |

***

### FR-21 — Prompt Style Selector

**Feature:** F8 - Style-Directed Enhancement
**Priority:** High

|           | Description |
|-----------|-------------|
| **Input** | User selects a prompt style from a dropdown before clicking "Enhance". Available options: `General` (default), `Step-by-Step Guide`, `Code Help`, `Creative Writing`, `Data Analysis`, `Detailed Explanation`. |
| **Process** | The selected style value is sent as an additional `style` parameter in the `POST /enhance` request body. The backend maps the style to a modified task prefix string before tokenization: English example: `"enhance prompt [code]: "`, Hindi example: `"prompt sudharo [code]: "`. If no style is selected or the value is `"general"`, the existing default prefix (`"enhance prompt: "` / `"prompt sudharo: "`) is used unchanged. |
| **Output** | The enhanced prompt is generated using the style-modified prefix. The selected style label is displayed alongside the output card (e.g., *"Enhanced as: Code Help"*). |

**Default state:** `General` (maps to existing default prefix — fully backward compatible)

**Validation:**
- If an unrecognized style value is received by the backend, fall back to `"general"` and log a warning — do not return an error.
- Style dropdown must be accessible via keyboard (tab + arrow keys).

**API change:** `POST /enhance` request body updated to:
```json
{
  "text": "string",
  "lang": "hi" | "en",
  "style": "general" | "stepbystep" | "code" | "creative" | "data" | "detailed"
}
```

***

### FR-22 — Session History Panel

**Feature:** F9 - In-Memory Session History
**Priority:** High

|           | Description |
|-----------|-------------|
| **Input** | Every successful response from `POST /enhance` that returns a non-empty `enhanced_prompt`. |
| **Process** | The React frontend appends a `{ id, input, output, style, lang, timestamp }` object to a `sessionHistory` array stored in React `useState`. The panel displays the last **5 entries** in reverse chronological order (newest first). Entries beyond 5 are dropped from the array (FIFO). No API call is made. No data is written to disk, `localStorage`, or any external store. |
| **Output** | A collapsible side panel (or bottom drawer on narrow viewports) renders each history entry as a card showing: truncated input (max 60 chars), truncated output (max 120 chars), timestamp, and a "Re-copy" button that copies the full output to clipboard. Clicking anywhere on the card expands it to show full content. |

**Constraints:**
- History is entirely in-memory. It is lost on page refresh. This is by design (satisfies NF-S4 — no persistence of user input to disk).
- The panel must not be visible when the history array is empty (IDLE state on first load).
- "Re-copy" button follows the same 2-second "Copied ✓" feedback behavior defined in FR-08.

**Validation:**
- Duplicate consecutive entries (same input text submitted twice) should still be stored as separate history items with distinct timestamps.

***

### FR-23 — Before/After Diff View

**Feature:** F10 - Enhancement Diff Visualization
**Priority:** Medium

|           | Description |
|-----------|-------------|
| **Input** | The original user input string and the `enhanced_prompt` string returned from `POST /enhance`. |
| **Process** | A "Show Diff" toggle button appears below the output card after a successful enhancement. When activated, the frontend computes a word-level diff between the input and the enhanced output using the `diff-match-patch` library (client-side, no backend call). Words present in the output but absent from the input are rendered with a green highlight. Words present in the input but absent from the output are rendered with a red strikethrough. Words unchanged between input and output are rendered in default text color. |
| **Output** | The output card switches between two sub-views toggled by the button: **Clean View** (default — plain enhanced prompt text) and **Diff View** (annotated diff rendering). The toggle button label reads "Show Diff" in Clean View and "Show Clean" in Diff View. |

**Constraints:**
- Diff computation is performed entirely in the browser using `diff-match-patch` (Apache 2.0 license, ~50KB, no server dependency).
- Diff View is opt-in — Clean View is always the default render.
- If the input and output are identical (no meaningful enhancement occurred), Diff View displays a notice: *"No differences detected — the output matches your input."*

**Dependency:** Requires `diff-match-patch` added to `package.json`.

***

### FR-24 — Tone Selector

**Feature:** F11 - Tone-Directed Enhancement
**Priority:** Medium

|           | Description |
|-----------|-------------|
| **Input** | User selects a tone from a 3-option button group displayed in the UI alongside the Style Selector (FR-21). Options: `Formal`, `Casual`, `Technical`. |
| **Process** | The selected tone is sent as a `tone` parameter in the `POST /enhance` request body. The backend appends a tone modifier to the task prefix, after the style modifier. Example combined prefix: `"enhance prompt [code] [formal]: "`. If no tone is selected, no tone modifier is appended (default behavior unchanged). |
| **Output** | Enhanced prompt is generated using the tone-modified prefix. The selected tone label is displayed alongside the style label in the output card metadata (e.g., *"Enhanced as: Code Help · Formal"*). |

**Default state:** No tone selected (neutral register — fully backward compatible with FR-06).

**Validation:**
- Tone and Style selectors are independent axes — any combination must be valid.
- If both Style and Tone are at their defaults (`general`, no tone), the request is identical to the original FR-06 behavior. No regression.

**API change:** `POST /enhance` request body updated to:
```json
{
  "text": "string",
  "lang": "hi" | "en",
  "style": "string",
  "tone": "formal" | "casual" | "technical" | ""
}
```

***

### FR-25 — Favorite / Pin a Prompt

**Feature:** F12 - Pinned Prompt Persistence
**Priority:** Medium

|           | Description |
|-----------|-------------|
| **Input** | User clicks a star (☆) icon on any history card in the Session History Panel (FR-22). |
| **Process** | The full history entry object `{ id, input, output, style, tone, lang, timestamp }` is saved to `localStorage` under the key `chota_packet_pinned`. The pinned list is capped at **10 entries**. If the cap is reached, the oldest pinned entry is removed (FIFO). On page load, the frontend reads `chota_packet_pinned` from `localStorage` and renders pinned entries in a dedicated "Pinned" section at the top of the history panel. |
| **Output** | Pinned entries appear in a visually distinct "Pinned Prompts" section with a filled star (★) icon. A "Unpin" action (clicking ★ again) removes the entry from `localStorage` and from the pinned section immediately. |

**Constraints:**
- `localStorage` stores only the prompt content strings and metadata — no audio, no files.
- All data remains on the local machine. This satisfies NF-S2 and NF-S4 in spirit (no external transmission), with the acknowledged exception that pinned entries persist to disk via `localStorage`. This exception must be noted in the security section.
- The pinned section must render correctly on fresh page load even if the session history array is empty.

**Validation:**
- The same prompt (matched by `id`) cannot be pinned twice.
- `localStorage` writes must be wrapped in a `try/catch` to handle storage quota errors gracefully — display an inline warning: *"Storage full. Unpin older prompts to save new ones."*

***

### FR-26 — Token Count and Context Window Indicator

**Feature:** F13 - Prompt Length Awareness
**Priority:** Low

|           | Description |
|-----------|-------------|
| **Input** | The `enhanced_prompt` string displayed in the output card after a successful enhancement. |
| **Process** | The frontend computes an estimated token count using the heuristic: `estimated_tokens = Math.ceil(wordCount × 1.33)`. Word count is derived by splitting on whitespace. The estimate is displayed alongside the output card. A color-coded horizontal progress bar visually represents token usage against a reference context window of **4096 tokens** (representing a conservative common LLM limit): Green (0–25% = 0–1024 tokens), Yellow (26–60% = 1025–2458 tokens), Red (>60% = 2459+ tokens). A tooltip on the bar reads: *"Approximate token estimate. Actual count may vary by model."* |
| **Output** | Below the output card, a single metadata line displays: *"~142 words · ~189 tokens · [progress bar]"*. This line updates live if the user edits the output (via F15 contenteditable). |

**Constraints:**
- Token count is an **approximation** — no tokenizer library is used. The 1.33× multiplier is a documented heuristic appropriate for mixed Hindi-English text (Devanagari tokens tend to be shorter on average).
- The 4096-token reference is a display default. No configurable context window setting is required in this version.
- This feature is purely cosmetic/informational — it does not affect enhancement behavior or any API call.

**Implementation note:** Entire implementation is frontend-only, approximately 15 lines of JavaScript. No new dependencies required.

***

### FR-27 — Enhancement Level Selector

**Feature:** F14 - Enhancement Depth Control
**Priority:** High

|           | Description |
|-----------|-------------|
| **Input** | User selects an enhancement level from a dropdown button placed **directly adjacent to the Send / Enhance button** in the UI. Available options: `Basic` (default), `Detailed`, `Advanced`. |
| **Process** | 1. The selected level value (`"basic"`, `"detailed"`, or `"advanced"`) is sent as an `enhancement_level` parameter in the `POST /enhance` JSON request body. 2. The backend maps the level to a **pre-written system prompt** (authored manually by the developer and stored server-side) that instructs the mT5-style generation about the desired depth and structure. These system prompts are **not generated at runtime** — they are static strings loaded at startup. 3. The system prompt for the selected level is prepended to or concatenated with the task prefix before tokenization, forming the final input string passed to the model. The three levels behave as follows: **Basic** — rewrites the rough prompt with clear, direct language; no structural additions. **Detailed** — adds role assignment, step-by-step structure, and context scaffolding to the prompt. **Advanced** — produces a high-complexity prompt with detailed role definition, multi-step structure, constraints, output format specification, and examples where applicable; generally longer and more sophisticated. |
| **Output** | The enhanced prompt is generated at the requested depth. The output card displays the active level label (e.g., *"Level: Advanced"*) alongside any existing style/tone metadata. |

**UI specification:**
- The dropdown is rendered as a compact button with a chevron (▾) indicator, positioned **to the immediate left of the Enhance button**.
- On mobile/narrow viewports it collapses to an icon-only button with a tooltip label.
- The selected level persists in React `useState` for the session duration (not persisted to `localStorage`).
- Default selection on app load: `Basic`.

**Default state:** `Basic` (backward-compatible with all existing FR-06 behavior when used without style or tone modifiers).

**Validation:**
- If the `enhancement_level` value received by the backend is unrecognized, fall back to `"basic"` and log a warning — do not return an error.
- The dropdown must be keyboard-accessible (tab + arrow keys) and labelled with `aria-label="Enhancement Level"`.
- All three system prompts must be defined and non-empty at server startup; if any are missing, the server must log an error and set `models_loaded = false`.

**API change:** `POST /enhance` request body updated to:
```json
{
  "text": "string",
  "lang": "hi" | "en",
  "style": "string",
  "tone": "formal" | "casual" | "technical" | "",
  "enhancement_level": "basic" | "detailed" | "advanced"
}
```

**Backend storage:** The three system prompts are stored in a dedicated config file (e.g., `backend/enhancement_prompts.py`) as Python string constants:
```python
ENHANCEMENT_SYSTEM_PROMPTS = {
    "basic":    "<developer-authored system prompt for basic rewrite>",
    "detailed": "<developer-authored system prompt for detailed structure>",
    "advanced": "<developer-authored system prompt for advanced complexity>"
}
```
The content of these strings is defined by the developer outside the scope of this SRS and may be updated independently without requiring a code change elsewhere.

***

### FR-28 — Editable Output Card (Already integrated in FR-07)

**Feature:** F15 - Direct Output Editing
**Priority:** High

*Note: This feature is already incorporated into FR-07. The enhanced prompt output is rendered in a `contenteditable` div or textarea, allowing users to directly modify the AI-generated text before copying. Changes are client-side only and do not trigger a new API call.*

***

### FR-29 — Regenerate Prompt / Multiple Variants

**Feature:** F16 - Variant Generation
**Priority:** High

|           | Description |
|-----------|-------------|
| **Input** | User clicks a "Regenerate" button below the output card after receiving an enhanced prompt. |
| **Process** | React re-sends the exact same input text and parameters (lang, style, tone, enhancement_level) to `POST /enhance`. The backend generates a new output using beam search sampling with `do_sample=True` and `temperature=0.8` (instead of deterministic beam search) to introduce variation. The new output replaces the current output in the display card. The previous output is added to session history (FR-22) before being replaced. |
| **Output** | A new enhanced prompt variant is displayed. User can regenerate multiple times to explore different phrasings. Each regeneration updates the session history. |

**Constraints:**
- Regenerate uses the **same input** but with **sampling-based generation** to produce variation.
- No limit on regeneration count within a session.
- Each regenerated output is a separate history entry (satisfies FR-22 behavior).

**UI specification:**
- "Regenerate" button appears alongside "Copy to Clipboard" in the output card.
- Button displays a refresh/cycle icon (🔄).
- Button is disabled during LOADING state to prevent duplicate requests.

**API modification:** Backend adds a `variant_mode` boolean parameter:
```json
{
  "text": "string",
  "lang": "hi" | "en",
  "style": "string",
  "tone": "string",
  "enhancement_level": "string",
  "variant_mode": true | false
}
```

When `variant_mode: true`, backend uses `do_sample=True, temperature=0.8` in generation call.

***

### FR-30 — Cross-Lingual Output Mode

**Feature:** F17 - Input-Output Language Separation
**Priority:** High

|           | Description |
|-----------|-------------|
| **Input** | User selects an "Output Language" toggle in addition to the existing "Input Language" toggle. Output Language options: `Same as Input` (default), `English`, `Hindi`. |
| **Process** | When Output Language is set to a different language than Input Language: 1. The backend receives both `input_lang` and `output_lang` parameters in the `POST /enhance` request. 2. The backend applies a modified task prefix that signals cross-lingual enhancement: `"enhance prompt (output: English): "` when input is Hindi and output is English, or `"enhance prompt (output: Hindi): "` when input is English and output is Hindi. 3. The mT5-small model (which is multilingual) generates the enhanced prompt in the target output language. |
| **Output** | Enhanced prompt is returned in the requested output language, regardless of input language. The output card displays both languages: *"Input: Hindi → Output: English"*. |

**Use case:** User writes rough idea in Hindi ("meri dukaan ke liye website") but wants output in English to paste into ChatGPT's English interface.

**Default state:** `Same as Input` (fully backward compatible with existing FR-06 behavior).

**Validation:**
- When Output Language is `Same as Input`, no cross-lingual prompt is applied — behaves identically to current system.
- Cross-lingual enhancement quality depends on training data including cross-lingual pairs. Document this limitation in NF-R2 update.

**API change:** `POST /enhance` request body updated to:
```json
{
  "text": "string",
  "input_lang": "hi" | "en",
  "output_lang": "hi" | "en" | "auto",
  "style": "string",
  "tone": "string",
  "enhancement_level": "string",
  "variant_mode": false
}
```

(`"auto"` maps to "same as input")

***

### FR-31 — User Feedback on Output Quality

**Feature:** F18 - Human-in-the-Loop Evaluation
**Priority:** Medium

|           | Description |
|-----------|-------------|
| **Input** | User clicks a thumbs-up (👍) or thumbs-down (👎) button displayed below each enhanced prompt in the output card. |
| **Process** | React stores the feedback rating along with the full request-response pair `{ id, input, output, style, tone, lang, enhancement_level, rating, timestamp }` in a dedicated `feedbackLog` array in `localStorage` (key: `chota_packet_feedback`). No API call is made. Feedback is stored locally only. |
| **Output** | The selected rating button is highlighted (filled icon). A subtle confirmation message appears: *"Thanks for your feedback!"*. User can change their rating by clicking the other button. |

**Constraints:**
- Feedback is **not transmitted** to any server (satisfies NF-S2).
- Feedback log is capped at 100 entries (FIFO when exceeded).
- A "View Feedback Log" button in settings (FR-36) allows users to see all rated prompts.
- Future extension: Developer can export feedback log via settings to analyze model performance offline.

**Rationale:**
- Demonstrates awareness of model quality evaluation for academic project.
- Provides data collection mechanism for iterative model improvement.
- Satisfies reviewer expectations for ML project evaluation rigor.

***

### FR-32 — Export History to File

**Feature:** F19 - Data Portability
**Priority:** Medium

|           | Description |
|-----------|-------------|
| **Input** | User clicks an "Export History" button in the session history panel or settings page. User selects export format: `JSON` or `TXT`. |
| **Process** | **JSON export:** React serializes the current `sessionHistory` array and `pinnedPrompts` array from `localStorage` as a single JSON object: `{ "session": [...], "pinned": [...], "exported_at": "ISO timestamp" }`. **TXT export:** React formats each history entry as human-readable text with separators. Both formats trigger a browser download via `Blob` and `URL.createObjectURL`. |
| **Output** | A file is downloaded to the user's default downloads folder: `chota_packet_history_YYYYMMDD_HHMMSS.json` or `.txt`. |

**Constraints:**
- Export includes only session history and pinned prompts — no feedback log (separate export in FR-31 extension).
- No upload/import feature in v1.0 (document as future work).
- File is generated entirely client-side — no backend API call.

**UI specification:**
- Export button appears in a dropdown menu (⋮) in the history panel header.
- Format selection via a modal dialog: "Export as: [JSON] [TXT]".

***

### FR-33 — Live Input Character/Word Counter

**Feature:** F20 - Input Length Awareness
**Priority:** Low

|           | Description |
|-----------|-------------|
| **Input** | User types text into the input field. |
| **Process** | React `onChange` handler computes character count and word count in real-time. Display updates on every keystroke. Color-coding: Green (0–400 chars), Yellow (401–480 chars), Red (481–512 chars). |
| **Output** | A counter display appears below the input field: *"248 / 512 characters · 42 words"*. When approaching limit (>480 chars), the counter turns orange/red. |

**Constraints:**
- Updates live on every `onChange` event (debounced by 50ms to reduce re-renders).
- Does not block input beyond 512 chars — truncation still occurs on submit (FR-01).
- Word count uses simple whitespace-split heuristic (same as FR-26 token counter).

**Implementation note:** Approximately 10 lines of React code. No new dependencies.

***

### FR-34 — Dark Mode / Theme Toggle

**Feature:** F21 - Visual Accessibility
**Priority:** Medium

|           | Description |
|-----------|-------------|
| **Input** | User clicks a sun/moon icon button in the app header to toggle theme. |
| **Process** | React toggles a `theme` state variable between `"light"` and `"dark"`. The selected theme is saved to `localStorage` (key: `chota_packet_theme`). Tailwind CSS `dark:` utility classes handle styling. On app load, React reads theme from `localStorage` and applies it before first render to prevent flash. |
| **Output** | Entire UI switches between light and dark color schemes. Theme persists across sessions. |

**Default state:** `"light"` (or respect system preference via `prefers-color-scheme` media query if `localStorage` is empty).

**Constraints:**
- All UI components must have `dark:` variants defined in Tailwind classes.
- Code blocks (output, diff view) use syntax-appropriate dark theme colors.
- Must not break accessibility contrast requirements (NF-A1).

**Implementation note:** Tailwind CSS has built-in dark mode support via `darkMode: 'class'` in `tailwind.config.js`.

***

### FR-35 — Keyboard Shortcuts

**Feature:** F22 - Power User Efficiency
**Priority:** Medium

|           | Description |
|-----------|-------------|
| **Input** | User presses a keyboard shortcut while the app is focused. |
| **Process** | React `useEffect` adds a global `keydown` event listener. Supported shortcuts: **Ctrl+Enter** (or Cmd+Enter on Mac) — Submit input for enhancement (same as clicking Enhance button). **Escape** — Cancel recording if active, or clear error message if in ERROR state, or reset to IDLE if in OUTPUT state. **Ctrl+Shift+C** — Copy enhanced prompt to clipboard (same as clicking Copy button). All shortcuts respect input focus state — Ctrl+Enter only works when text input is focused. |
| **Output** | Actions are triggered without mouse interaction. Visual feedback matches button click behavior (e.g., "Copied ✓" confirmation). |

**Constraints:**
- Shortcuts must not conflict with browser defaults (avoid Ctrl+R, Ctrl+T, etc.).
- Shortcuts are disabled during LOADING state to prevent duplicate actions.
- A "Keyboard Shortcuts" help modal is accessible via a `?` button in the header (displays shortcut reference card).

**Validation:**
- Shortcuts must work across Windows/Mac/Linux with appropriate modifier key translation (Ctrl vs Cmd).

***

### FR-36 — Settings / Preferences Panel

**Feature:** F23 - User Preference Persistence
**Priority:** Medium

|           | Description |
|-----------|-------------|
| **Input** | User clicks a gear icon (⚙️) in the app header to open the settings modal. |
| **Process** | Settings modal displays configurable preferences: **Default Input Language:** `Hindi` / `English` (default). **Default Enhancement Level:** `Basic` / `Detailed` / `Advanced`. **Default Theme:** `Light` / `Dark` / `Auto (System)`. **Clear Pinned Prompts:** Button to delete all pinned entries. **Export Feedback Log:** Button to download feedback data (FR-31). All settings are stored in `localStorage` under key `chota_packet_settings`. On app load, React reads settings and applies defaults to all relevant controls. |
| **Output** | User preferences persist across sessions. Each setting includes a "Reset to Default" button. A "Save" button closes the modal and applies changes. |

**Constraints:**
- Settings affect only default states — user can still change language/level/theme manually in each session.
- Clear Pinned Prompts requires confirmation dialog: *"Delete all 7 pinned prompts? This cannot be undone."*
- Settings modal is accessible via keyboard (Tab navigation, Enter to save, Escape to cancel).

**Implementation note:** Modal uses React Portal for clean z-index layering.

***

### FR-37 — First-Run Onboarding / Interactive Tutorial

**Feature:** F24 - New User Experience
**Priority:** Low

|           | Description |
|-----------|-------------|
| **Input** | App detects this is the user's first visit (no `chota_packet_onboarding_complete` key in `localStorage`). |
| **Process** | On first load, an interactive tooltip walkthrough overlay appears: **Step 1:** Highlights text input field — *"Type your rough idea here (in Hindi or English)"*. **Step 2:** Highlights Enhance button — *"Click here to transform your idea into a polished prompt"*. **Step 3:** Highlights output card — *"Your enhanced prompt appears here. You can edit it before copying!"*. **Step 4:** Highlights Copy button — *"Click to copy and paste into ChatGPT, Gemini, or Claude"*. User can click "Next" to proceed, "Skip Tutorial" to dismiss, or "Got it!" on final step. On completion, set `chota_packet_onboarding_complete: true` in `localStorage`. |
| **Output** | New users complete their first enhancement within 90 seconds (satisfies NF-U1). Returning users never see the tutorial again (unless they clear localStorage). |

**Constraints:**
- Tutorial can be manually re-triggered via Settings panel ("Replay Tutorial" button).
- Tooltip overlay uses library like `react-joyride` or custom implementation.
- Tutorial is fully skippable — never blocks core functionality.

**Validation:**
- Must work correctly on narrow/mobile viewports (tooltips reposition responsively).

***

### FR-41 — OpenRouter API Key Management

**Feature:** F25 - OpenRouter API Key Integration
**Priority:** High

|           | Description |
|-----------|-------------|
| **Input** | User opens the Settings Panel (FR-36) and enters their OpenRouter API key into a dedicated "API Key" text field. The field uses `type="password"` masking by default with a "Show/Hide" toggle. |
| **Process** | 1. The entered key is validated **client-side** for format: must start with `sk-or-v1-` and be at least 40 characters. 2. If format is valid, the frontend sends the key to `POST /validate-key` on the backend. The backend makes a lightweight request to OpenRouter's `/api/v1/auth/key` endpoint to verify the key is active and has remaining credits. 3. On success, the key is stored **encrypted** in `localStorage` under key `chota_packet_openrouter_key` using AES-256 encryption with a device-derived key. 4. The UI displays a green checkmark: *"API key verified ✓"* and enables the Model Selector dropdown (FR-42). 5. On failure (invalid key, expired, no credits), the UI displays a red inline error: *"Invalid API key"*, *"Key expired"*, or *"No credits remaining"*. |
| **Output** | A validated, encrypted API key is stored in `localStorage`. The cloud model inference mode becomes available. The Settings Panel shows a "Remove API Key" button that clears the stored key and reverts to local-only mode. |

**Edge Cases:**
- **Empty submission:** "Enhance" button remains enabled but uses local model. No error shown — cloud mode simply stays disabled.
- **Key with insufficient credits:** Backend returns credit balance from OpenRouter response. UI displays: *"Key validated but balance is $0.00. Add credits at openrouter.ai to use cloud models."*
- **Network failure during validation:** Display: *"Could not validate key — check your internet connection. You can still use the local model."* Key is NOT saved.
- **Key revoked after initial validation:** Handled at inference time (FR-42 error handling).
- **localStorage unavailable / full:** Display: *"Cannot save API key — browser storage is unavailable."* Offer session-only mode where the key is kept in React state for the current session but not persisted.
- **User clears browser data:** Key is lost. User must re-enter. No recovery mechanism — by design, for security.

**Security:**
- The raw API key is NEVER logged to console, included in error messages, or sent to any endpoint other than OpenRouter.
- Stored key is encrypted at rest in `localStorage`. Decryption occurs only at the moment of use.
- A *"Why is my key safe?"* tooltip explains: *"Your key is encrypted and stored only in your browser. It is sent directly to OpenRouter — never to our server's logs or any third party."*

**Validation:**
- Format regex: `/^sk-or-v1-[a-zA-Z0-9]{32,}$/`
- Backend validation endpoint must respond within 5 seconds; timeout triggers the network failure edge case.
- Removing the API key immediately disables cloud model options and reverts all UI to local model defaults.

***

### FR-42 — Cloud Model Selection and Inference via OpenRouter

**Feature:** F25 - OpenRouter API Key Integration
**Priority:** High

|           | Description |
|-----------|-------------|
| **Input** | User selects a cloud model from the "Model" dropdown that appears in the UI when a valid OpenRouter API key is stored. The dropdown shows a curated list of models with display names and approximate cost per request: e.g., `GPT-4o (~$0.005/req)`, `Claude 3.5 Sonnet (~$0.008/req)`, `Gemini 1.5 Flash (~$0.001/req)`, `Llama 3.1 70B (~$0.002/req)`, `Mistral Large (~$0.004/req)`, `Local Model (Free, Offline)`. The "Local Model" option is always present and is the default even when a key is stored. |
| **Process** | 1. When a cloud model is selected and user clicks "Enhance": the frontend sends the request to `POST /enhance` with an additional `model` parameter (e.g., `"openai/gpt-4o"`) and an `inference_mode` parameter set to `"cloud"`. 2. The backend receives the request, decrypts the stored API key (passed via a secure header `X-OpenRouter-Key`), and forwards the user's input as a chat completion request to `https://openrouter.ai/api/v1/chat/completions`. 3. The system prompt used for the selected `enhancement_level` (FR-27) is sent as the `system` message, and the user's input (with style/tone modifiers) is sent as the `user` message. 4. The OpenRouter response is parsed, and the `enhanced_prompt` is returned to the frontend in the same response format as local model inference. 5. The output card displays a subtle badge: *"Enhanced by GPT-4o via OpenRouter"* or equivalent, so the user knows which model was used. |
| **Output** | Enhanced prompt generated by the selected cloud model, displayed in the same output card with model attribution badge. |

**Edge Cases:**
- **OpenRouter API timeout (>15s):** Cancel the request. Display: *"Cloud model request timed out. Try again or switch to the local model."* UI transitions to ERROR state with a "Retry" and "Use Local Model" button.
- **OpenRouter returns HTTP 401 (key invalid/revoked):** Display: *"Your API key is no longer valid. Please update it in Settings."* Automatically clear the stored key and revert Model dropdown to "Local Model" only.
- **OpenRouter returns HTTP 402 (insufficient credits):** Display: *"Insufficient credits on your OpenRouter account. Add credits at openrouter.ai or switch to the local model (free)."*
- **OpenRouter returns HTTP 429 (rate limited):** Display: *"You've been rate-limited by OpenRouter. Please wait a moment and try again."* Include retry-after duration if provided in the response header.
- **OpenRouter returns HTTP 5xx (server error):** Display: *"OpenRouter is temporarily unavailable. The local model is still available."* Offer one-click fallback.
- **Network disconnected mid-request:** Display: *"Network connection lost. Switching to local model."* Automatically retry the same input with `inference_mode: "local"` and show a toast notification about the fallback.
- **Model discontinued on OpenRouter:** If the selected model returns a "model not found" error, display: *"The selected model is no longer available. Please choose a different model."* Remove the model from the local cache and refresh the model list.
- **Extremely long output from cloud model:** Truncate at 2000 tokens with a notice: *"Output was truncated to 2000 tokens. The full response may be longer than expected."*
- **Cost accumulation awareness:** After every cloud request, update a running session cost counter in the UI: *"Session cost: ~$0.023"*. This resets on page refresh. No billing enforced — purely informational.

**Fallback behavior:**
- If cloud inference fails for ANY reason, the system must offer a one-click "Use Local Model Instead" button that immediately re-processes the same input through the local mT5-small pipeline (FR-06). This ensures the user is NEVER blocked.
- The fallback button is persistent in the ERROR state and does not require re-entering the input.

**API change:** `POST /enhance` request body updated to:
```json
{
  "text": "string",
  "input_lang": "hi" | "en",
  "output_lang": "hi" | "en" | "auto",
  "style": "string",
  "tone": "formal" | "casual" | "technical" | "",
  "enhancement_level": "basic" | "detailed" | "advanced",
  "variant_mode": false,
  "inference_mode": "local" | "cloud",
  "model": "openai/gpt-4o" | "anthropic/claude-3.5-sonnet" | "google/gemini-1.5-flash" | "meta-llama/llama-3.1-70b" | "mistralai/mistral-large" | null
}
```

When `inference_mode` is `"local"` or `model` is `null`, the request is handled entirely by the local mT5-small model (FR-06). No OpenRouter call is made.

**New API endpoint:**

| Method | Endpoint | Request Body | Response |
|--------|----------|--------------|----------|
| **POST** | `/validate-key` | `application/json`: `{ "key": "string" }` | `{ "valid": true, "credits_remaining": 4.23, "rate_limit": { "requests": 200, "interval": "10s" } }` or `{ "valid": false, "reason": "string" }` |
| **GET** | `/models` | None (requires valid key in `X-OpenRouter-Key` header) | `{ "models": [ { "id": "openai/gpt-4o", "name": "GPT-4o", "cost_per_token": 0.000005 }, ... ] }` |

**UI specification:**
- The Model Selector dropdown is positioned in the toolbar area, near the Enhancement Level selector.
- When no API key is stored, the dropdown shows only `Local Model (Free, Offline)` and is non-interactive (greyed out with tooltip: *"Add your OpenRouter API key in Settings to unlock cloud models"*).
- When a key is stored, the dropdown becomes active with the full model list.
- A small "⚡ Cloud" or "🏠 Local" badge appears near the Enhance button to indicate the current inference mode at a glance.
- Session cost counter appears in the bottom status bar only when at least one cloud request has been made.

**Model list management:**
- The curated model list is stored as a static config in the backend (`backend/openrouter_models.py`) for initial load.
- Optionally, the backend can fetch the latest model list from OpenRouter's `/api/v1/models` endpoint on startup and cache it. If the fetch fails, the static fallback list is used.
- The frontend caches the model list in `sessionStorage` to avoid repeated API calls.

***

### FR-38 — ffmpeg Availability Check at Startup

**Feature:** Risk Mitigation (R-03)
**Priority:** Medium

|           | Description |
|-----------|-------------|
| **Input** | FastAPI server startup (within lifespan context manager). |
| **Process** | Backend runs a subprocess check: `subprocess.run(["ffmpeg", "-version"], capture_output=True)`. If ffmpeg is not found (FileNotFoundError) or returns non-zero exit code, log a warning to stderr: *"ffmpeg not found. Audio conversion will fail. Install ffmpeg: https://ffmpeg.org/download.html"*. Set `app.state.ffmpeg_available = False`. The `/stt` endpoint checks this flag before processing audio; if false, return HTTP 503 with error: *"Audio processing unavailable. Server is missing ffmpeg dependency."* |
| **Output** | Server provides clear diagnostic instead of cryptic crash. User sees actionable error message in UI. |

**Constraints:**
- Check runs once at startup (not per-request).
- Does not block server from starting — only `/stt` is affected.
- `/health` response includes `ffmpeg_available` field for frontend diagnostics.

***

### FR-39 — Unit Test Coverage for ML Pipeline

**Feature:** Quality Assurance
**Priority:** Medium

|           | Description |
|-----------|-------------|
| **Input** | Developer runs `pytest tests/` in the backend directory. |
| **Process** | Unit tests cover: **test_model_loading** — Verify mT5 and Whisper models load without error. **test_tokenization** — Verify task prefix prepending and tokenization. **test_enhancement_output_format** — Verify output is non-empty string with no special tokens. **test_hallucination_detection** — Verify 4-gram repetition filter triggers correctly. **test_audio_validation** — Verify file size/MIME type checks reject invalid input. **test_api_endpoints** — Verify /health, /enhance, /stt return expected response structure. Minimum 15 unit tests required. |
| **Output** | All tests pass. Coverage report generated via `pytest-cov`. Target: >80% code coverage for backend/models.py and backend/routes.py. |

**Constraints:**
- Tests use mock objects for model inference (avoid loading full models in CI).
- Tests must run in <30 seconds total.
- Documented in `tests/README.md` with instructions to run.

***

### FR-40 — Accessibility Compliance Audit

**Feature:** WCAG 2.1 Level AA Baseline
**Priority:** Medium

|           | Description |
|-----------|-------------|
| **Input** | Developer runs `axe-core` accessibility audit tool on the React app. |
| **Process** | Verify compliance with: **Keyboard navigation:** All interactive elements (buttons, dropdowns, toggles) are accessible via Tab/Shift+Tab and operable via Enter/Space. **Focus indicators:** Visible focus outline on all focusable elements (not removed via `outline: none`). **ARIA labels:** All icon-only buttons have `aria-label`. Dropdowns have `aria-expanded`. History panel has `role="region"` and `aria-label`. **Color contrast:** All text meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large/bold text). Both light and dark themes pass. **Screen reader testing:** Test with NVDA (Windows) or VoiceOver (Mac) to verify all features are announced correctly. |
| **Output** | Zero critical or serious accessibility violations reported by axe-core. Document findings in `ACCESSIBILITY.md`. |

**Constraints:**
- Audio features (recording, transcription) must have visual feedback for deaf users (pulsing indicator, countdown timer).
- Error messages must be associated with inputs via `aria-describedby`.
- Loading states must use `aria-live="polite"` for screen reader announcements.

***

# 4. Non-Functional Requirements

## 4.1 Performance

| ID | Requirement |
|---|---|
| **NF-P1** | The `/enhance` endpoint must return a response within **10 seconds** on hardware with 4GB RAM and an Intel Core i5 or equivalent CPU |
| **NF-P2** | The `/stt` endpoint must return a transcription within **8 seconds** for a 30-second audio clip on equivalent hardware |
| **NF-P3** | Total combined RAM usage of both loaded models must not exceed **2.5 GB** during inference |
| **NF-P4** | The React frontend must render the initial page within **2 seconds** of browser navigation to `localhost:3000` |
| **NF-P5** | Server startup time (both models loaded) must not exceed **60 seconds** on minimum hardware |
| **NF-P6** | Dark mode toggle (FR-34) must apply theme change within **100ms** with no visible flash |
| **NF-P7** | Keyboard shortcuts (FR-35) must respond within **50ms** of keypress |
| **NF-P8** | Cloud model inference via OpenRouter (FR-42) must return a response within **15 seconds**. If OpenRouter does not respond within this window, the request is cancelled and the user is offered a local model fallback. |
| **NF-P9** | API key validation (FR-41 `/validate-key`) must complete within **5 seconds**. Timeout is treated as a network failure — key is not saved. |

## 4.2 Reliability

| ID | Requirement |
|---|---|
| **NF-R1** | The system must produce a valid enhanced prompt (non-empty, grammatically coherent) for at least **85% of well-formed English inputs** in user testing |
| **NF-R2** | The system must produce a valid enhanced prompt for at least **75% of well-formed Hindi inputs** in user testing. Cross-lingual enhancement (FR-30) quality is expected to be **60%** for first release due to limited training data. |
| **NF-R3** | The `/stt` endpoint must successfully transcribe clearly spoken Hindi and English audio with a Word Error Rate (WER) below **20%** under normal acoustic conditions |
| **NF-R4** | The FastAPI server must handle a request without crashing even if the model output is empty or malformed - returning a structured error response instead (see FR-06) |
| **NF-R5** | The application must function correctly after the backend has been running continuously for a minimum of 4 hours without restart |
| **NF-R6** | Regenerate feature (FR-29) must produce meaningfully different outputs (>30% word difference) at least **70%** of the time |
| **NF-R7** | If cloud model inference fails (any HTTP error, timeout, or network issue), the system must gracefully degrade to local model inference within **2 seconds** of the failure without requiring user re-entry of input. The user must be notified of the fallback via a toast message. |
| **NF-R8** | Cloud model responses must be validated for emptiness, excessive length (>2000 tokens), and malformed content before being displayed to the user. Invalid responses trigger the same fallback error message used by FR-16. |

## 4.3 Portability

| ID | Requirement |
|---|---|
| **NF-PT1** | The backend must run on Windows 10, macOS 11, and Ubuntu 20.04 without code changes - only environment setup differs |
| **NF-PT2** | All Python dependencies must be specified in `requirements.txt` with version pins. All Node.js dependencies must be specified in `package.json` |
| **NF-PT3** | The system must not require a GPU at runtime - CPU-only inference must be supported |
| **NF-PT4** | The application setup must be completable using a `README.md` with step-by-step instructions by someone with basic terminal knowledge |
| **NF-PT5** | Exported history files (FR-32) must be readable on all major platforms (Windows, Mac, Linux, mobile) without special software |

## 4.4 Security

| ID | Requirement |
|---|---|
| **NF-S1** | The FastAPI server must configure CORS to **only accept requests from `localhost:3000`** - blocking all other origins |
| **NF-S2** | No user input (text or audio) must be transmitted to any external server or third-party API during runtime operation — **unless the user has explicitly opted into cloud inference by providing their own OpenRouter API key (FR-41)**. When cloud inference is active, only the prompt text and selected parameters are sent to OpenRouter. Audio data is NEVER sent to OpenRouter. |
| **NF-S3** | Audio files uploaded to `/stt` must be deleted from server memory immediately after transcription completes - no disk persistence |
| **NF-S4** | The application must not persist any user input or audio to disk during normal operation. **Exception:** User-initiated pinned prompts (FR-25), feedback ratings (FR-31), and the encrypted OpenRouter API key (FR-41) are stored in browser `localStorage` at the user's explicit request and remain under their control. No data is transmitted externally except when the user explicitly invokes cloud inference. |
| **NF-S5** | Exported history files (FR-32) must be saved to user's local filesystem only - never uploaded to cloud or external service |
| **NF-S6** | The OpenRouter API key must be stored **encrypted** in `localStorage` (AES-256 with a device-derived key). The raw key must NEVER appear in: console logs, error messages, network request logs visible in the frontend, or any persisted data other than the encrypted store. |
| **NF-S7** | The backend must proxy all OpenRouter API calls (the frontend must NEVER call OpenRouter directly) to prevent API key exposure in browser DevTools network tab. The key is sent from the frontend to the backend via a secure header (`X-OpenRouter-Key`) over localhost only. |
| **NF-S8** | When the user removes their API key via Settings, the encrypted key must be immediately and irrecoverably deleted from `localStorage`. No cached or residual copy may remain. |


## 4.5 Usability

| ID | Requirement |
|---|---|
| **NF-U1** | A new user must be able to complete their first prompt enhancement within **90 seconds** of opening the application, aided by first-run onboarding (FR-37) |
| **NF-U2** | All loading states must display visible feedback (spinner or progress text) so the user knows the system is processing |
| **NF-U3** | Error messages must be human-readable and actionable - not raw stack traces or HTTP status codes |
| **NF-U4** | All interactive elements must have visible hover and focus states for discoverability |
| **NF-U5** | The UI must be responsive and functional on viewport widths from 320px (mobile) to 2560px (large desktop) |

## 4.6 Accessibility

| ID | Requirement |
|---|---|
| **NF-A1** | All text must meet WCAG 2.1 Level AA contrast requirements (4.5:1 for normal text, 3:1 for large text) in both light and dark modes |
| **NF-A2** | All interactive elements must be keyboard-accessible and have visible focus indicators (FR-40) |
| **NF-A3** | All icon-only buttons must have descriptive `aria-label` attributes |
| **NF-A4** | Screen reader users must be able to complete the core enhancement workflow (input → enhance → copy) using NVDA or VoiceOver |
| **NF-A5** | The accessibility audit (FR-40) must report zero critical or serious violations from `axe-core` |

## 4.7 Maintainability

| ID | Requirement |
|---|---|
| **NF-M1** | The backend codebase must be organized into a minimum of three modules: (1) `main.py` (FastAPI app definition and lifespan), (2) `models.py` (model loading and inference functions), (3) `routes.py` (endpoint handlers). No single file may exceed 300 lines. All public functions must have docstrings. |
| **NF-M2** | The frontend must use a consistent component structure with separated concerns (UI components in `components/`, state management in hooks, API calls in `services/`) |
| **NF-M3** | All magic numbers and configuration values must be defined as named constants at the top of files or in dedicated config files |

## 4.8 Testability

| ID | Requirement |
|---|---|
| **NF-T1** | A minimum of **20 acceptance test cases** must be defined before submission, covering: (a) 10 English enhancement test pairs with expected output characteristics (not exact strings), (b) 5 Hindi enhancement test pairs, (c) 3 STT test cases with pre-recorded audio clips and expected transcription substrings, (d) 2 error-path test cases (empty input, backend offline). Results must be documented in a `test_results.md` file. |
| **NF-T2** | The ROUGE-L score of the fine-tuned model on a held-out validation set of minimum 40 pairs (10% of total dataset) must be reported. The validation set must not overlap with the training set. A baseline ROUGE-L score using the raw input as its own enhanced output (identity baseline) must also be reported to demonstrate that the model adds value beyond passthrough. |
| **NF-T3** | Unit test coverage (FR-39) must achieve >80% code coverage for `models.py` and `routes.py` modules |

# 5. System Models

## 5.1 Use Case Descriptions

***

### UC-01 - Enhance a Prompt via Text Input

**Actor:** User
**Precondition:** FastAPI server is running, both models are loaded in memory
**Main Flow:**
1. User opens `localhost:3000` in their browser
2. User selects language (English/Hindi) via the toggle
3. User types a rough idea into the text input field
4. User clicks the "Enhance" button
5. System displays a loading indicator
6. System calls `POST /enhance` with the input text and language
7. mT5-small generates the enhanced prompt
8. System displays the enhanced prompt in the output card
9. User clicks "Copy to Clipboard"
10. User pastes the enhanced prompt into ChatGPT/Gemini/Claude

**Alternate Flow - Enhancement Fails:**
- At step 7, if the model returns an empty string, the system displays: *"Enhancement failed. Please rephrase and try again."*

**Postcondition:** An enhanced, clipboard-ready prompt is produced

***

### UC-02 - Enhance a Prompt via Voice Input

**Actor:** User
**Precondition:** Microphone permission granted, server running with models loaded
**Main Flow:**
1. User selects language (Hindi/English) via toggle
2. User clicks the microphone button
3. Browser begins recording audio via `MediaRecorder`
4. User speaks their rough idea (up to 60 seconds)
5. User clicks the microphone button again to stop
6. System sends audio blob to `POST /stt`
7. Whisper Tiny transcribes the audio in the selected language
8. Transcribed text appears in the text input box (editable)
9. User reviews and optionally corrects the transcription
10. User clicks "Enhance" - flow continues from UC-01 step 4

**Alternate Flow - No Speech Detected:**
- At step 7, if audio is silent, system displays: *"No speech detected. Please try again."*
- Text input box remains empty and editable

**Alternate Flow - Microphone Permission Denied:**
- At step 2, if permission is denied, system displays: *"Microphone access is required for voice input."*

**Postcondition:** Transcribed and user-reviewed text is available for enhancement

***

## 5.2 Data Flow Summary

**Level 0 - Context Diagram:**

```
[User] ──(raw text / voice)──▶ [CHOTA PACKET SYSTEM] ──(enhanced prompt)──▶ [User]
```

**Level 1 - Major Data Flows:**

```
[User Input] ──text──────────────────────────────────────────▶ [FastAPI /enhance]
[User Input] ──audio + lang──────────────────────────────────▶ [FastAPI /stt]

[FastAPI /stt] ──16kHz WAV──────────────────────────────────▶ [Whisper Tiny]
[Whisper Tiny] ──raw transcript──────────────────────────────▶ [Script Normalizer]
[Script Normalizer] ──clean text──────────────────────────────▶ [React Text Box]

[FastAPI /enhance] ──prefixed input string──────────────────▶ [mT5-small + LoRA]
[mT5-small + LoRA] ──token IDs──────────────────────────────▶ [mT5 Decoder]
[mT5 Decoder] ──decoded string──────────────────────────────▶ [Post-Processor]
[Post-Processor] ──enhanced prompt──────────────────────────▶ [React Output Card]
```

***

## 5.3 State Diagram - Frontend UI States

```
[IDLE] ──── user types/records ────▶ [INPUT READY]
                                           │
                               user clicks Enhance
                                           │
                                           ▼
                                      [LOADING]
                                           │
                              API responds (success/fail)
                                    ┌──────┴──────┐
                                    ▼             ▼
                               [OUTPUT]        [ERROR]
                              show prompt    show message
                                    │             │
                              user clicks     user edits
                              "New Prompt"    input again
                                    └──────┬──────┘
                                           ▼
                                        [IDLE]
```

***

# 6. Risk Analysis

| Risk ID | Risk Description | Probability | Impact | Mitigation |
|---------|------------------|-------------|--------|------------|
| **R-01** | mT5-small generates low-quality output | High | High | Augment dataset to 600+ pairs; add human eval rubric; define minimum ROUGE-L threshold of 0.35 on validation set |
| **R-02** | float16 CPU crash on low-end hardware | High | High | Use float32 unconditionally on CPU (see FR-09 correction) |
| **R-03** | ffmpeg not installed on target machine | Medium | High | Add ffmpeg to README setup checklist; implement startup check (FR-38) that provides clear error message |
| **R-04** | 400 training pairs insufficient | Medium | High | Use GPT-4 API (one-time, <$2) for synthetic data generation to reach 600 pairs |
| **R-05** | LoRA target modules incorrect for mT5 | Medium | High | Verify with `model.named_modules()` before training; document confirmed module names |
| **R-06** | 3-week timeline insufficient | Medium | Medium | Prioritize FR-01, FR-06, FR-09 (core loop); defer FR-29, FR-30, FR-32, FR-37, FR-39, FR-40 (enhancement features) to post-submission polish |
| **R-07** | Cross-lingual enhancement (FR-30) performs poorly | High | Medium | Document as experimental feature; set realistic expectation (60% quality); recommend training data augmentation with GPT-4-generated cross-lingual pairs |
| **R-08** | adapter_model.safetensors format change | Low | High | Pin `peft==0.10.0` in requirements.txt; test load on clean venv |
| **R-09** | Dark mode breaks visual contrast (NF-A1) | Medium | Medium | Run axe-core audit on both themes before release; use Tailwind's built-in dark color palette |
| **R-10** | localStorage quota exceeded with large history | Low | Low | Implement FIFO pruning (FR-25, FR-31) with user warning; cap pinned prompts at 10, feedback at 100 entries |
| **R-11** | OpenRouter API key leaked via browser DevTools or logs | Medium | High | Backend proxies all OpenRouter calls (NF-S7); key encrypted in localStorage (NF-S6); key never logged; frontend never calls OpenRouter directly |
| **R-12** | OpenRouter rate limiting blocks user requests | Medium | Medium | Display clear rate-limit message with retry-after countdown; offer instant local model fallback; document OpenRouter's free-tier limits in onboarding tooltip |
| **R-13** | User accumulates unexpected costs via cloud inference | Medium | High | Display per-request cost estimate in model selector; show running session cost counter; display cost confirmation dialog on first cloud request: *"This will use your OpenRouter credits (~$0.005). Continue?"*; "Local Model (Free)" is always the default |
| **R-14** | Cloud model dependency creates false expectation of always-available cloud | Low | Medium | UI clearly labels cloud models as "Requires Internet + API Key"; local model is always default; cloud features gracefully degrade when offline; first-run onboarding (FR-37) focuses exclusively on local model flow |

***

# 7. Appendix

## 7.1 Technology Stack Reference

| Layer | Technology | Version | License | Purpose |
|-------|------------|---------|---------|---------|
| **Base ML Model** | `google/mt5-small` via HuggingFace Hub | - | Apache 2.0 | Multilingual seq2seq base model |
| **Fine-Tuning** | `peft` (LoRA) | 0.10 | Apache 2.0 | Parameter-efficient adapter training |
| **Training Framework** | `transformers` | 4.40 | Apache 2.0 | Model loading, training, inference |
| **Training Backend** | PyTorch | 2.2 | BSD | Tensor computation |
| **Training Environment** | Google Colab T4 GPU | Free tier | - | One-time model training |
| **STT Model** | `openai/whisper-tiny` via HuggingFace Hub | - | MIT | Multilingual speech-to-text |
| **Audio Processing** | `soundfile`, `librosa` | latest stable | BSD, ISC | WAV conversion and normalization |
| **Backend Framework** | FastAPI | 0.115 | MIT | REST API server |
| **ASGI Server** | Uvicorn | 0.29 | BSD | FastAPI runtime server |
| **Frontend Framework** | React | 18.x | MIT | UI development |
| **HTTP Client** | Axios | 1.6 | MIT | API communication from React |
| **CSS Framework** | Tailwind CSS | 3.x | MIT | Utility-first styling with dark mode support |
| **Diff Engine** | `diff-match-patch` | latest | Apache 2.0 | Client-side word diff for FR-23 |
| **Evaluation Metric** | ROUGE-L via `rouge-score` | - | Apache 2.0 | Model output quality measurement |
| **Unit Testing** | `pytest`, `pytest-cov` | latest | MIT | Backend test suite (FR-39) |
| **Accessibility Audit** | `axe-core` (via browser extension or React integration) | latest | MPL 2.0 | WCAG compliance checking (FR-40) |
| **Cloud LLM Gateway** | OpenRouter API (`openrouter.ai/api/v1`) | v1 | — | Unified API gateway for GPT-4o, Claude, Gemini, Llama, Mistral, and 200+ models (FR-41, FR-42) |
| **HTTP Client (Backend)** | `httpx` | 0.27+ | BSD | Async HTTP client for backend-to-OpenRouter API calls |
| **Encryption** | Web Crypto API (browser-native) | — | — | AES-256 encryption for API key storage in localStorage (NF-S6) |

## 7.2 API Endpoint Reference

| Method | Endpoint | Request Body | Response |
|--------|----------|--------------|----------|
| **GET** | `/health` | None | `{ "status": "ok", "models_loaded": true, "ffmpeg_available": true }` |
| **POST** | `/stt` | `multipart/form-data`: `audio` (file), `lang` (string) | `{ "text": "string" }` |
| **POST** | `/enhance` | `application/json`: `{ "text": "string", "input_lang": "hi"\|"en", "output_lang": "hi"\|"en"\|"auto", "style": "string", "tone": "formal"\|"casual"\|"technical"\|"", "enhancement_level": "basic"\|"detailed"\|"advanced", "variant_mode": false, "inference_mode": "local"\|"cloud", "model": "string"\|null }`. Header: `X-OpenRouter-Key` (optional, required when `inference_mode: "cloud"`) | `{ "enhanced_prompt": "string", "model_used": "string"\|null, "cost_estimate": 0.005\|null }` |
| **POST** | `/validate-key` | `application/json`: `{ "key": "string" }` | `{ "valid": true, "credits_remaining": 4.23, "rate_limit": { "requests": 200, "interval": "10s" } }` or `{ "valid": false, "reason": "string" }` |
| **GET** | `/models` | None. Header: `X-OpenRouter-Key` (required) | `{ "models": [ { "id": "openai/gpt-4o", "name": "GPT-4o", "cost_per_token": 0.000005 }, ... ] }` |

**POST /stt Error Responses:**
- **400**: `{ "error": "Invalid audio file", "detail": "string" }`
- **503**: `{ "error": "Models not loaded. Check server logs." }` or `{ "error": "Audio processing unavailable. Server is missing ffmpeg dependency." }` (FR-38)
- **500**: `{ "error": "Transcription failed", "detail": "string" }`

**POST /enhance Error Responses:**
- **400**: `{ "error": "Invalid request", "detail": "string" }`
- **401**: `{ "error": "Invalid or expired OpenRouter API key", "detail": "string" }` (cloud mode only)
- **402**: `{ "error": "Insufficient OpenRouter credits", "detail": "string" }` (cloud mode only)
- **429**: `{ "error": "Rate limited by OpenRouter", "retry_after": 30 }` (cloud mode only)
- **503**: `{ "error": "Models not loaded. Check server logs." }` or `{ "error": "OpenRouter is temporarily unavailable. Use local model." }`
- **422**: Standard FastAPI validation error (Pydantic)
- **500**: `{ "error": "Enhancement failed. Please rephrase your input." }`

**POST /validate-key Error Responses:**
- **400**: `{ "error": "Invalid key format" }`
- **408**: `{ "error": "Validation timed out. Check internet connection." }`
- **502**: `{ "error": "Could not reach OpenRouter. Try again later." }`

**GET /models Error Responses:**
- **401**: `{ "error": "Invalid API key" }`
- **503**: `{ "error": "Could not fetch model list. Using cached defaults." }`

**Note:** The `/health` endpoint is a lightweight diagnostic endpoint — useful for confirming the server and models are ready before making real requests. Implement this first — it takes 5 minutes and saves hours of debugging.

## 7.3 Training Dataset Format

```json
{
  "input": "enhance prompt: make a website for my shop",
  "target": "Design a responsive e-commerce website for a small retail business. Include a homepage showcasing featured products, a catalog with category filters, a shopping cart, and a contact page with a map. Use a clean, mobile-first design with fast loading times."
},
{
  "input": "prompt sudharo: meri dukaan ke liye website banao",
  "target": "Ek chhoti retail dukaan ke liye ek responsive e-commerce website design karo. Featured products ke saath homepage, category filters ke saath product catalog, shopping cart aur contact page shamil karo. Mobile-first aur tez loading wala design use karo."
}
```

**Minimum 400 pairs. Aim for 600 pairs (300 English, 300 Hindi) to improve quality. Cover at least 5 domains: coding help, content writing, image generation, data analysis, general knowledge. For cross-lingual support (FR-30), include 50+ cross-lingual pairs where input and target are in different languages.**

## 7.4 Use Case Descriptions

### UC-01 - Enhance a Prompt via Text Input

**Actor:** User
**Precondition:** FastAPI server is running, both models are loaded in memory

**Main Flow:**
1. User opens `localhost:3000` in their browser
2. User selects language (English/Hindi) via the toggle
3. User types a rough idea into the text input field
4. User optionally selects style, tone, and enhancement level
5. User clicks the "Enhance" button (or presses Ctrl+Enter via FR-35)
6. System displays a loading indicator
7. System calls `POST /enhance` with the input text and parameters
8. mT5-small generates the enhanced prompt
9. System displays the enhanced prompt in the output card (editable via FR-07/FR-28)
10. User optionally edits the output directly
11. User clicks "Copy to Clipboard" (or presses Ctrl+Shift+C via FR-35)
12. User pastes the enhanced prompt into ChatGPT/Gemini/Claude

**Alternate Flow - Enhancement Fails:**
- At step 8, if the model returns an empty string, the system displays *"Enhancement failed. Please rephrase and try again."*

**Postcondition:** An enhanced, clipboard-ready prompt is produced

---

### UC-02 - Enhance a Prompt via Voice Input

**Actor:** User
**Precondition:** Microphone permission granted, server running with models loaded

**Main Flow:**
1. User selects language (Hindi/English) via toggle
2. User clicks the microphone button
3. Browser begins recording audio via MediaRecorder
4. User speaks their rough idea (up to 60 seconds)
5. User clicks the microphone button again to stop
6. System sends audio blob to `POST /stt`
7. Whisper Tiny transcribes the audio in the selected language
8. Transcribed text appears in the text input box (editable)
9. User reviews and optionally corrects the transcription
10. User clicks "Enhance" - flow continues from UC-01 step 4

**Alternate Flow - No Speech Detected:**
- At step 7, if audio is silent, system displays *"No speech detected. Please try again."*
- Text input box remains empty and editable

**Alternate Flow - Microphone Permission Denied:**
- At step 2, if permission is denied, system displays *"Microphone access is required for voice input."*

**Postcondition:** Transcribed and user-reviewed text is available for enhancement

---

### UC-03 - Regenerate Enhanced Prompt (New)

**Actor:** User
**Precondition:** User has received an enhanced prompt output in OUTPUT state

**Main Flow:**
1. User reviews the current enhanced prompt
2. User clicks the "Regenerate" button (🔄 icon) next to Copy button
3. System re-sends the same input with `variant_mode: true` to `POST /enhance`
4. Backend generates a new variant using sampling (temperature=0.8)
5. Previous output is added to session history (FR-22)
6. New enhanced prompt replaces current output in display card
7. User can repeat steps 2-6 to explore multiple variations

**Postcondition:** User has multiple prompt variants to choose from in session history

---

### UC-04 - Export History (New)

**Actor:** User
**Precondition:** User has at least one entry in session history or pinned prompts

**Main Flow:**
1. User clicks "⋮" menu button in history panel header
2. User selects "Export History"
3. Modal dialog appears: "Export as: [JSON] [TXT]"
4. User selects desired format
5. System generates file client-side from localStorage and session state
6. Browser downloads file: `chota_packet_history_YYYYMMDD_HHMMSS.json` (or `.txt`)
7. User can open file in any text editor or JSON viewer

**Postcondition:** User's prompt history is saved to local filesystem for backup or sharing

---

### UC-05 - First-Time User Onboarding (New)

**Actor:** New User
**Precondition:** User visits app for the first time (no `chota_packet_onboarding_complete` in localStorage)

**Main Flow:**
1. User opens `localhost:3000` in browser
2. Backend connectivity check passes (FR-13)
3. Interactive tooltip overlay appears highlighting text input
4. Tooltip displays: *"Type your rough idea here (in Hindi or English)"* with "Next" button
5. User clicks "Next" — tooltip moves to Enhance button
6. Tooltip displays: *"Click here to transform your idea"* with "Next" button
7. User clicks "Next" — tooltip moves to output card area
8. Tooltip displays: *"Your enhanced prompt appears here. You can edit it!"* with "Next" button
9. User clicks "Next" — tooltip moves to Copy button
10. Tooltip displays: *"Copy and paste into ChatGPT!"* with "Got it!" button
11. User clicks "Got it!" — overlay disappears
12. System sets `chota_packet_onboarding_complete: true` in localStorage
13. User proceeds to use app normally

**Alternate Flow - Skip Tutorial:**
- At any step, user clicks "Skip Tutorial" button
- Overlay immediately disappears and step 12 is executed

**Postcondition:** User understands core workflow and can complete first enhancement within 90 seconds (NF-U1)

---

### UC-06 - Enhance a Prompt via Cloud Model (New)

**Actor:** User
**Precondition:** User has a valid OpenRouter API key stored in Settings; internet connection is available

**Main Flow:**
1. User opens Settings (⚙️) and enters their OpenRouter API key
2. System validates key via `POST /validate-key` — green checkmark appears
3. User closes Settings and returns to main UI
4. Model Selector dropdown is now active — user selects "GPT-4o (~$0.005/req)"
5. A "⚡ Cloud" badge appears near the Enhance button
6. User types a rough idea and clicks "Enhance"
7. System sends request to `POST /enhance` with `inference_mode: "cloud"` and `model: "openai/gpt-4o"`
8. Backend proxies the request to OpenRouter
9. Enhanced prompt is displayed with badge: *"Enhanced by GPT-4o via OpenRouter"*
10. Session cost counter updates: *"Session cost: ~$0.005"*
11. User copies the enhanced prompt

**Alternate Flow - Cloud Model Fails:**
- At step 8, if OpenRouter returns an error (timeout, 5xx, rate limit), the UI displays an error with two buttons: "Retry" and "Use Local Model Instead"
- Clicking "Use Local Model Instead" re-processes the same input through mT5-small without requiring re-entry

**Alternate Flow - Key Expired Mid-Session:**
- At step 8, if OpenRouter returns HTTP 401, the UI displays: *"Your API key is no longer valid. Please update it in Settings."*
- The stored key is cleared automatically
- Model Selector reverts to "Local Model" only

**Alternate Flow - Insufficient Credits:**
- At step 8, if OpenRouter returns HTTP 402, the UI displays: *"Insufficient credits. Add credits at openrouter.ai or switch to the local model (free)."*

**Postcondition:** User receives a cloud-enhanced prompt with model attribution and cost tracking

## 7.5 Data Flow Summary

```
Level 0 - Context Diagram:
[User: raw text/voice] → [CHOTA PACKET SYSTEM] → [User: enhanced prompt]
                                    ↕ (optional, user opt-in)
                          [OpenRouter Cloud API]

Level 1 - Major Data Flows:

User Input (text) → FastAPI /enhance
User Input (audio + lang) → FastAPI /stt
User API Key → FastAPI /validate-key → OpenRouter /auth/key

FastAPI /stt → 16kHz WAV → Whisper Tiny
Whisper Tiny → raw transcript → Script Normalizer
Script Normalizer → clean text → React Text Box

                          ┌─── inference_mode: "local" ───┐
FastAPI /enhance ─────────┤                                 ├──→ Post-Processor → React Output Card
                          └─── inference_mode: "cloud" ────┘

Local path:
  FastAPI /enhance → prefixed input string → mT5-small + LoRA
  mT5-small + LoRA → token IDs → mT5 Decoder
  mT5 Decoder → decoded string → Post-Processor

Cloud path (F25):
  FastAPI /enhance → system prompt + user message → OpenRouter API
  OpenRouter API → cloud model response → Post-Processor
  (Fallback on failure) → Local path
```

## 7.6 State Diagram - Frontend UI States

```
[IDLE]
  ↓ user types/records
[INPUT_READY]
  ↓ user clicks Enhance
[LOADING]
  ↓ API responds (success/fail)
[OUTPUT] / [ERROR]
  ↓ user edits output (if OUTPUT)
[OUTPUT]
  ↓ user clicks Copy / Regenerate / New Prompt
[IDLE] / [LOADING] (regenerate)

Recording Sub-State:
[IDLE]
  ↓ user clicks microphone
[RECORDING]
  ↓ user clicks stop / timeout
[LOADING (STT)]
  ↓ transcription complete
[IDLE] (text populated)
```

## 7.7 localStorage Schema Reference

```javascript
// Theme preference (FR-34)
chota_packet_theme: "light" | "dark"

// Settings persistence (FR-36)
chota_packet_settings: {
  default_input_lang: "hi" | "en",
  default_enhancement_level: "basic" | "detailed" | "advanced",
  default_theme: "light" | "dark" | "auto"
}

// Pinned prompts (FR-25)
chota_packet_pinned: [
  {
    id: "uuid",
    input: "string",
    output: "string",
    style: "string",
    tone: "string",
    input_lang: "hi" | "en",
    output_lang: "hi" | "en",
    enhancement_level: "string",
    model_used: "string" | null,
    timestamp: "ISO 8601 string"
  },
  // ... max 10 entries
]

// User feedback log (FR-31)
chota_packet_feedback: [
  {
    id: "uuid",
    input: "string",
    output: "string",
    style: "string",
    tone: "string",
    lang: "hi" | "en",
    enhancement_level: "string",
    rating: "thumbs_up" | "thumbs_down",
    timestamp: "ISO 8601 string"
  },
  // ... max 100 entries
]

// Onboarding completion flag (FR-37)
chota_packet_onboarding_complete: true | false

// Encrypted OpenRouter API key (FR-41)
chota_packet_openrouter_key: "<AES-256 encrypted string>" | null

// Cached model list (FR-42) — stored in sessionStorage, not localStorage
// sessionStorage: chota_packet_models_cache
chota_packet_models_cache: [
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    cost_per_token: 0.000005,
    context_window: 128000
  },
  // ... fetched from /models endpoint
]
```

## 7.8 References

1. Xue, L. et al. - *mT5: A Massively Multilingual Pre-Trained Text-to-Text Transformer*, NAACL 2021
2. Hu, E. et al. - *LoRA: Low-Rank Adaptation of Large Language Models*, ICLR 2022
3. Radford, A. et al. - *Robust Speech Recognition via Large-Scale Weak Supervision (Whisper)*, OpenAI 2022
4. HuggingFace Documentation - `transformers`, `peft`, `datasets` libraries - https://huggingface.co/docs
5. FastAPI Documentation - https://fastapi.tiangolo.com
6. MDN Web Docs - MediaRecorder API - https://developer.mozilla.org
7. Lin, C.Y. - *ROUGE: A Package for Automatic Evaluation of Summaries*, ACL Workshop 2004
8. W3C - *Web Content Accessibility Guidelines (WCAG) 2.1*, 2018 - https://www.w3.org/WAI/WCAG21/quickref/
9. Tailwind CSS Documentation - Dark Mode - https://tailwindcss.com/docs/dark-mode

***

**Document End - Chota Packet SRS v2.0**

