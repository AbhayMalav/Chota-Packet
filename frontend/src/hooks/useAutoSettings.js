import { useState, useEffect, useRef, useCallback } from 'react'
import { getModels } from '../services/api'
import { LS_DARK, LS_KEY, LS_MODEL } from '../constants'

// ── crypto helpers (Web Crypto AES-GCM, key derived from fixed app salt) ─────

const ALGO = 'AES-GCM'
const KEY_USAGE = ['encrypt', 'decrypt']

async function getSubtleKey() {
  const raw = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode('chota-packet-v2-').slice(0, 16),
    { name: ALGO },
    false,
    KEY_USAGE,
  )
  return raw
}

async function encryptKey(plaintext) {
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const key = await getSubtleKey()
    const enc = await crypto.subtle.encrypt(
      { name: ALGO, iv },
      key,
      new TextEncoder().encode(plaintext),
    )
    const buf = new Uint8Array(iv.byteLength + enc.byteLength)
    buf.set(iv, 0)
    buf.set(new Uint8Array(enc), iv.byteLength)
    return btoa(String.fromCharCode(...buf))
  } catch (err) {
    console.warn('[useSettings] encryptKey failed:', err)
    return null
  }
}

async function decryptKey(cipher) {
  try {
    const buf = Uint8Array.from(atob(cipher), (c) => c.charCodeAt(0))
    const iv = buf.slice(0, 12)
    const data = buf.slice(12)
    const key = await getSubtleKey()
    const dec = await crypto.subtle.decrypt({ name: ALGO, iv }, key, data)
    return new TextDecoder().decode(dec)
  } catch (err) {
    console.warn('[useSettings] decryptKey failed — treating as no key:', err)
    return null
  }
}

// ── hook ──────────────────────────────────────────────────────────────────────

export default function useSettings() {
  const [openRouterKey, setOpenRouterKey] = useState(null)
  // 'idle' | 'saving' | 'valid' | 'invalid'
  const [keyStatus, setKeyStatus] = useState('idle')
  const [keyReady, setKeyReady] = useState(false)   // ← true once async decrypt done

  const [selectedModel, setSelectedModel] = useState(
    () => localStorage.getItem(LS_MODEL) || '',
  )
  const [models, setModels] = useState([])

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem(LS_DARK) !== 'false',
  )

  const modelsFetchedForKey = useRef(null)  // track which key we last fetched for

  // ── 1. Decrypt saved key on mount ─────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY)
    if (!stored) {
      setKeyReady(true)
      return
    }
    decryptKey(stored).then((plain) => {
      if (plain) {
        setOpenRouterKey(plain)
        setKeyStatus('valid')
      } else {
        // Corrupt / un-decryptable storage — wipe it
        localStorage.removeItem(LS_KEY)
      }
      setKeyReady(true)
    })
  }, [])

  // ── 2. Fetch models whenever key changes (and is non-null) ────────────────
  // FIX: was called on mount before decrypt resolved → key was always null
  useEffect(() => {
    if (!keyReady) return                          // ← wait for decrypt
    if (openRouterKey === modelsFetchedForKey.current) return  // no change

    modelsFetchedForKey.current = openRouterKey

    getModels(openRouterKey)
      .then((res) => {
        const list = res?.data?.models
        if (Array.isArray(list) && list.length > 0) {
          setModels(list)
          // If saved model isn't in the new list, clear the selection
          const savedModel = localStorage.getItem(LS_MODEL) || ''
          if (savedModel && !list.some((m) => m.id === savedModel)) {
            setSelectedModel('')
            localStorage.removeItem(LS_MODEL)
          }
        }
      })
      .catch((err) => {
        console.warn('[useSettings] Model fetch failed:', err?.message ?? err)
        // Non-fatal — UI falls back to whatever is already in `models`
      })
  }, [openRouterKey, keyReady])

  // ── 3. Persist dark mode ──────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem(LS_DARK, String(darkMode))
  }, [darkMode])

  // ── Actions ───────────────────────────────────────────────────────────────

  const saveKey = useCallback(async (rawKey) => {
    if (!rawKey?.trim()) return
    setKeyStatus('saving')

    if (!rawKey.startsWith('sk-or-v1-')) {
      setKeyStatus('invalid')
      return
    }

    const cipher = await encryptKey(rawKey.trim())
    if (!cipher) {
      setKeyStatus('invalid')
      return
    }

    localStorage.setItem(LS_KEY, cipher)
    setOpenRouterKey(rawKey.trim())
    setKeyStatus('valid')
  }, [])

  const clearKey = useCallback(() => {
    localStorage.removeItem(LS_KEY)
    setOpenRouterKey(null)
    setKeyStatus('idle')
    setModels([])
    modelsFetchedForKey.current = null
  }, [])

  const saveModel = useCallback((modelId) => {
    setSelectedModel(modelId)
    if (modelId) {
      localStorage.setItem(LS_MODEL, modelId)
    } else {
      localStorage.removeItem(LS_MODEL)
    }
  }, [])

  const toggleDark = useCallback(() => setDarkMode((d) => !d), [])

  // inferenceMode is derived — cloud only when a real key exists
  const inferenceMode = openRouterKey ? 'cloud' : 'local'

  return {
    openRouterKey,
    keyStatus,
    inferenceMode,
    selectedModel,
    saveModel,
    models,
    darkMode,
    toggleDark,
    saveKey,
    clearKey,
  }
}
