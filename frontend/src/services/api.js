import axios from 'axios'
import { API_BASE, ENHANCE_TIMEOUT_MS, STT_TIMEOUT_MS } from '../constants'

// Local timeouts not worth a constants.js entry yet — revisit if more endpoints are added
const HEALTH_TIMEOUT_MS = 5_000
const VALIDATE_KEY_TIMEOUT_MS = 8_000

const client = axios.create({ baseURL: API_BASE, timeout: ENHANCE_TIMEOUT_MS })

/**
 * Ping the backend. Used by App.jsx on mount to determine connection status.
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const health = () => client.get('/health', { timeout: HEALTH_TIMEOUT_MS })

/**
 * Send a prompt enhancement request.
 * @param {object} payload - Enhancement payload (text, style, tone, level, etc.)
 * @param {string|null} openRouterKey - Optional OpenRouter API key from settings.
 * @param {AbortSignal} [signal] - Optional AbortController signal to cancel the request.
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const enhance = (payload, openRouterKey, signal) =>
  client.post('/enhance', payload, {
    headers: openRouterKey ? { 'X-OpenRouter-Key': openRouterKey } : {},
    ...(signal ? { signal } : {}),
  })

/**
 * Submit an audio blob for speech-to-text transcription.
 * @param {Blob} audioBlob - Recorded audio blob (webm format expected).
 * @param {string} [lang='en'] - BCP-47 language code for transcription.
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const stt = (audioBlob, lang = 'en') => {
  if (!audioBlob || audioBlob.size === 0) {
    console.warn('stt: called with a missing or empty audioBlob — request aborted.')
    return Promise.reject(new Error('audioBlob is required and must be non-empty.'))
  }

  const form = new FormData()
  form.append('audio', audioBlob, 'recording.webm')
  form.append('lang', lang || 'en')

  return client.post('/stt', form, { timeout: STT_TIMEOUT_MS })
}

/**
 * Validate an OpenRouter API key against the backend.
 * @param {string} key - The API key to validate.
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const validateKey = (key) => {
  if (!key || !key.trim()) {
    console.warn('validateKey: called with a blank or null key — request aborted.')
    return Promise.reject(new Error('A non-empty API key is required.'))
  }

  return client.post('/validate-key', { key }, { timeout: VALIDATE_KEY_TIMEOUT_MS })
}

/**
 * Fetch available models from OpenRouter via the backend.
 * @param {string|null} openRouterKey - Optional OpenRouter API key from settings.
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getModels = (openRouterKey) =>
  client.get('/models', {
    headers: openRouterKey ? { 'X-OpenRouter-Key': openRouterKey } : {},
  })
