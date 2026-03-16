import { useState, useEffect, useCallback } from 'react'
import { LS_KEY, LS_MODEL, LS_DARK } from '../constants'
import { encryptKey, decryptKey } from '../services/crypto'
import { getModels } from '../services/api'

export function useSettings() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(LS_DARK) === '1')
  const [openRouterKey, setOpenRouterKey] = useState(null) // plaintext, only in memory
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem(LS_MODEL) || '')
  const [models, setModels] = useState([])
  const [keyStatus, setKeyStatus] = useState('idle') // idle | saving | valid | invalid

  // Theme effect: :root is dark by default; add .light class when in light mode
  useEffect(() => {
    document.documentElement.classList.toggle('light', !darkMode)
    localStorage.setItem(LS_DARK, darkMode ? '1' : '0')
  }, [darkMode])

  // Load encrypted key on mount
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY)
    if (stored) {
      decryptKey(stored).then(setOpenRouterKey).catch(() => {})
    }
  }, [])

  // Fetch models list and handle model auto-fallback/update
  useEffect(() => {
    getModels(openRouterKey)
      .then(({ data }) => {
        const fetchedModels = data.models || [];
        setModels(fetchedModels);
        
        // Auto-fix if selected model vanishes or we have no model while having a key
        if (fetchedModels.length > 0) {
          const currentModelId = localStorage.getItem(LS_MODEL);
          // If no model selected yet, or model went missing from API
          if (!currentModelId || !fetchedModels.some(m => m.id === currentModelId)) {
            // Pick the first free model (after local), or the first cloud model
            const fallbackModel = fetchedModels.find(m => m.id !== 'local' && m.cost_per_1k_tokens === 0) 
              || fetchedModels.find(m => m.id !== 'local') 
              || fetchedModels[0];
              
            if (fallbackModel) {
              setSelectedModel(fallbackModel.id);
              localStorage.setItem(LS_MODEL, fallbackModel.id);
            }
          }
        }
      })
      .catch(() => {})
  }, [openRouterKey])

  const saveKey = useCallback(async (plainKey) => {
    setKeyStatus('saving')
    try {
      // Validate format first (must start with sk-or-v1-)
      if (!plainKey.startsWith('sk-or-v1-')) {
        setKeyStatus('invalid')
        return false
      }
      const encrypted = await encryptKey(plainKey)
      localStorage.setItem(LS_KEY, encrypted)
      setOpenRouterKey(plainKey)
      setKeyStatus('valid')
      return true
    } catch {
      setKeyStatus('invalid')
      return false
    }
  }, [])

  const clearKey = useCallback(() => {
    localStorage.removeItem(LS_KEY)
    setOpenRouterKey(null)
    setKeyStatus('idle')
  }, [])

  const saveModel = useCallback((model) => {
    setSelectedModel(model)
    localStorage.setItem(LS_MODEL, model)
  }, [])

  const toggleDark = useCallback(() => setDarkMode((d) => !d), [])

  return {
    darkMode, toggleDark,
    openRouterKey, saveKey, clearKey, keyStatus,
    selectedModel, saveModel, models,
    inferenceMode: openRouterKey && selectedModel ? 'cloud' : 'local',
  }
}
