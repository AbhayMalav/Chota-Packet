// constants.js - App-wide constants and lookup tables for Chota Packet.
// Environment variable required in .env: VITE_API_BASE (see .env.example)


// ── API ───────────────────────────────────────────────────────────────────────


// Reads from VITE_API_BASE env var; falls back to localhost for local dev.
// In production, set VITE_API_BASE in your deployment environment.
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'


export const ENHANCE_TIMEOUT_MS = 20_000
export const STT_TIMEOUT_MS = 15_000


// ── Input limits ──────────────────────────────────────────────────────────────


export const MAX_INPUT_CHARS = 512   // local model context ceiling
export const MAX_PINNED = 10    // max items user can pin across sessions


// Capped low intentionally - in-memory only, cleared on refresh.
// Increase if session persistence (e.g. IndexedDB) is added later.
export const HISTORY_LIMIT = 5


// Max feedback votes stored in localStorage before new ones are dropped.
export const FEEDBACK_CAP = 100


// ── Prompt options ────────────────────────────────────────────────────────────


export const STYLES = [
  { value: 'auto', label: 'Auto' },
  { value: 'general', label: 'General' },
  { value: 'creative', label: 'Creative' },
  { value: 'code', label: 'Code' },
  { value: 'stepbystep', label: 'Step-by-Step' },
  { value: 'data', label: 'Data Analysis' },
  { value: 'detailed', label: 'Detailed' },
  { value: 'academic', label: 'Academic' },
  { value: 'marketing', label: 'Marketing' },
]


export const TONES = [
  { value: 'auto', label: 'Auto' },
  { value: '', label: 'No Tone' },
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'technical', label: 'Technical' },
]


export const LEVELS = [
  { value: 'auto', label: 'Auto' },
  { value: 'basic', label: 'Basic' },
  { value: 'detailed', label: 'Detailed' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'chain_of_thought', label: 'Chain of Thought' },
  { value: 'meta', label: 'Meta' },
  { value: 'prompt_chaining', label: 'Prompt Chaining' },
  { value: 'multi_prompt_fusion', label: 'Multi-Prompt Fusion' },
  { value: 'soft_prompting', label: 'Soft Prompting' },
]


// ── Language options ──────────────────────────────────────────────────────────


export const LANGS = [
  { value: 'en', label: 'EN' },
  { value: 'hi', label: 'HI' },
]


export const OUT_LANGS = [
  { value: 'auto', label: 'Auto' },
  { value: 'en', label: 'EN' },
  { value: 'hi', label: 'HI' },
]


// ── localStorage keys ─────────────────────────────────────────────────────────


export const LS_DARK = 'chota_dark'
export const LS_KEY = 'chota_key'
export const LS_MODEL = 'chota_model'
export const LS_PINNED = 'chota_pinned'
export const LS_ONBOARDED = 'chota_onboarded'
export const LS_FEEDBACK = 'chota_feedback'
export const LS_ANALYTICS = 'cp-token-analytics'  // ← ADDED
export const LS_THEME = 'cp-theme'


export const THEMES = [
  { id: 'brand', label: 'Default', color: '#7f13ec' },
  { id: 'orange', label: 'Orange', color: '#F97316' },
  { id: 'carrot', label: 'Carrot Red', color: '#E4400A' },
  { id: 'blue', label: 'Blue', color: '#3B82F6' },
  { id: 'teal', label: 'Teal', color: '#14B8A6' },
  { id: 'brown', label: 'Brown', color: '#92400E' },
  { id: 'dusk', label: 'Dusk', background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)' },
]


// ── Utilities ─────────────────────────────────────────────────────────────────


// Rough token estimate: 1 token ≈ 4 chars (GPT-style tokenisation heuristic).
// Coerces input to string so numbers/objects don't silently produce wrong counts.
export const estimateTokens = (text) =>
  Math.ceil(String(text ?? '').length / 4)


// ── Keyboard shortcuts ────────────────────────────────────────────────────────


export const SHORTCUT_GROUPS = [
  {
    group: 'Generation',
    items: [
      { keys: ['Ctrl', 'Enter'], desc: 'Enhance prompt' },
      { keys: ['Ctrl', 'Shift', 'Enter'], desc: 'Regenerate (variant)' },
      { keys: ['Ctrl', 'Shift', 'M'], desc: 'Toggle voice input' },
    ],
  },
  {
    group: 'Output',
    items: [
      { keys: ['Ctrl', 'Shift', 'C'], desc: 'Copy output to clipboard' },
      { keys: ['Ctrl', 'Shift', 'V'], desc: 'Toggle compare view' },
      { keys: ['Ctrl', 'L'], desc: 'Clear output only' },
      { keys: ['Ctrl', 'Shift', 'K'], desc: 'Clear everything' },
    ],
  },
  {
    group: 'Navigation',
    items: [
      { keys: ['Ctrl', 'B'], desc: 'Toggle history / sidebar' },
      { keys: ['Ctrl', ','], desc: 'Open settings' },
      { keys: ['?'], desc: 'Toggle shortcuts' },
      { keys: ['Ctrl', '/'], desc: 'Toggle shortcuts' },
      { keys: ['Ctrl', 'Shift', 'D'], desc: 'Toggle dark mode' },
      { keys: ['Escape'], desc: 'Close any open panel' },
    ],
  },
  {
    group: 'Enhancement levels',
    items: [
      { keys: ['Alt', '1'], desc: 'Level → Basic' },
      { keys: ['Alt', '2'], desc: 'Level → Detailed' },
      { keys: ['Alt', '3'], desc: 'Level → Advanced' },
      { keys: ['Alt', '4'], desc: 'Level → Chain of Thought' },
      { keys: ['Alt', '5'], desc: 'Level → Meta' },
    ],
  },
]
