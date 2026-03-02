export const API_BASE = 'http://localhost:8000'
export const ENHANCE_TIMEOUT_MS = 20_000
export const STT_TIMEOUT_MS = 15_000
export const MAX_INPUT_CHARS = 512
export const MAX_PINNED = 10
export const HISTORY_LIMIT = 5
export const FEEDBACK_CAP = 100

export const STYLES = [
  { value: 'general',   label: 'General' },
  { value: 'creative',  label: 'Creative' },
  { value: 'code',      label: 'Code' },
  { value: 'academic',  label: 'Academic' },
  { value: 'marketing', label: 'Marketing' },
]

export const TONES = [
  { value: '',          label: 'No Tone' },
  { value: 'formal',    label: 'Formal' },
  { value: 'casual',    label: 'Casual' },
  { value: 'technical', label: 'Technical' },
]

export const LEVELS = [
  { value: 'basic',    label: 'Basic' },
  { value: 'detailed', label: 'Detailed' },
  { value: 'advanced', label: 'Advanced' },
]

export const LANGS = [
  { value: 'en', label: 'EN' },
  { value: 'hi', label: 'HI' },
]

export const OUT_LANGS = [
  { value: 'auto', label: 'Auto' },
  { value: 'en',   label: 'EN' },
  { value: 'hi',   label: 'HI' },
]

export const LS_DARK   = 'chota_dark'
export const LS_KEY    = 'chota_key'
export const LS_MODEL  = 'chota_model'
export const LS_PINNED = 'chota_pinned'
export const LS_ONBOARDED = 'chota_onboarded'
export const LS_FEEDBACK  = 'chota_feedback'

// Rough token estimate: 1 token ≈ 4 chars
export const estimateTokens = (text) => Math.ceil((text || '').length / 4)
