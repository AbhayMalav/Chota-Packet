import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { encryptKey, decryptKey } from '../services/crypto'
import { getModels } from '../services/api'
import { LS_KEY, LS_MODEL, LS_DARK, LS_THEME } from '../constants'

// ── Helpers ───────────────────────────────────────────────────────────────────

function readStorage(key, fallback = null) {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(`[useSettings] localStorage.setItem("${key}") failed:`, err)
    }
  }
}

function removeStorage(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Manages all user-facing settings: dark mode, API key, model selection.
 * All localStorage keys come from constants.js - never hardcoded here.
 *
 * @returns {object} settings and setters
 */
export default function useSettings() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true   // SSR safe - default dark
    return readStorage(LS_DARK, '1') === '1'
  })

  const [openRouterKey, setOpenRouterKey] = useState(null) // plaintext, memory-only
  const [selectedModel, setSelectedModel] = useState(() => readStorage(LS_MODEL, ''))
  const [models, setModels] = useState([])
  const [modelsError, setModelsError] = useState(null)
  const [keyStatus, setKeyStatus] = useState('idle') // idle|saving|valid|invalid

  const keyStatusTimerRef = useRef(null)

  // ── Theme ──────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => readStorage(LS_THEME, 'brand'))

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('light', !darkMode)
    
    // Clear potentially existing theme classes
    root.classList.remove('theme-brand', 'theme-orange', 'theme-carrot', 'theme-blue', 'theme-teal', 'theme-brown', 'theme-dusk')
    root.classList.add(`theme-${theme}`)

    writeStorage(LS_DARK, darkMode ? '1' : '0')
    writeStorage(LS_THEME, theme)
  }, [darkMode, theme])

  // ── Load encrypted key on mount ────────────────────────────────────────────
  useEffect(() => {
    const stored = readStorage(LS_KEY)
    if (!stored) return

    decryptKey(stored)
      .then(setOpenRouterKey)
      .catch((err) => {
        // Corrupted or tampered key - clear it so user is prompted to re-enter
        if (import.meta.env.DEV) {
          console.warn('[useSettings] Failed to decrypt stored key - clearing:', err)
        }
        removeStorage(LS_KEY)
        setOpenRouterKey(null)
      })
  }, [])

  // ── Fetch models - abort on key change or unmount ──────────────────────────
  useEffect(() => {
    const controller = new AbortController()

    getModels(openRouterKey, controller.signal)
      .then(({ data }) => {
        if (controller.signal.aborted) return

        setModelsError(null)
        const fetched = Array.isArray(data.models) ? data.models : []
        setModels(fetched)

        if (fetched.length === 0) return

        // Auto-fallback: if current model is missing or unset, pick best free model
        setSelectedModel((current) => {
          const stillValid = current && fetched.some((m) => m.id === current)
          if (stillValid) return current

          const fallback =
            fetched.find((m) => m.id !== 'local' && m.cost_per_1k_tokens === 0) ??
            fetched.find((m) => m.id !== 'local') ??
            fetched[0]

          if (fallback) {
            writeStorage(LS_MODEL, fallback.id)
            return fallback.id
          }
          return current
        })
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        if (import.meta.env.DEV) {
          console.warn('[useSettings] getModels failed:', err)
        }
        setModelsError('Could not load models. Check your connection.')
      })

    return () => controller.abort()
  }, [openRouterKey])

  // ── inferenceMode ──────────────────────────────────────────────────────────
  const inferenceMode = useMemo(() => {
    if (selectedModel === 'local') return 'local'
    if (openRouterKey) return 'cloud'
    return 'local'
  }, [selectedModel, openRouterKey])

  // ── Actions ────────────────────────────────────────────────────────────────

  const saveKey = useCallback(async (plainKey) => {
    setKeyStatus('saving')
    setModelsError(null)
    clearTimeout(keyStatusTimerRef.current)

    if (!plainKey.startsWith('sk-or-v1-')) {
      setKeyStatus('invalid')
      return
    }

    try {
      const encrypted = await encryptKey(plainKey)
      writeStorage(LS_KEY, encrypted)
      setOpenRouterKey(plainKey)
      setKeyStatus('valid')

      // Auto-reset status after 3s so "Key saved" doesn't persist forever
      keyStatusTimerRef.current = setTimeout(() => setKeyStatus('idle'), 3000)
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[useSettings] encryptKey failed:', err)
      }
      setKeyStatus('invalid')
    }
  }, [])

  const clearKey = useCallback(() => {
    clearTimeout(keyStatusTimerRef.current)
    removeStorage(LS_KEY)
    setOpenRouterKey(null)
    setModelsError(null)
    setKeyStatus('idle')
  }, [])

  const saveModel = useCallback((model) => {
    setSelectedModel(model)
    writeStorage(LS_MODEL, model)
  }, [])

  const toggleDark = useCallback(() => setDarkMode((d) => !d), [])

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(keyStatusTimerRef.current), [])

  return {
    darkMode, toggleDark,
    theme, setTheme,
    openRouterKey, saveKey, clearKey, keyStatus,
    selectedModel, saveModel, models, modelsError,
    inferenceMode,
  }
}
