import React, { useState, useCallback, useEffect } from 'react'

export default function SettingsModal({ onClose, settings }) {
  const { openRouterKey, saveKey, clearKey, keyStatus, selectedModel, saveModel, models } = settings
  const [keyInput, setKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)

  const handleSave = useCallback(async () => {
    await saveKey(keyInput.trim())
    setKeyInput('')
  }, [keyInput, saveKey])

  const handleClear = useCallback(() => {
    clearKey()
    setKeyInput('')
  }, [clearKey])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const statusLabel = {
    idle: null,
    saving: <span className="text-amber-500">Saving…</span>,
    valid: <span className="text-emerald-500">✓ Key saved</span>,
    invalid: <span className="text-red-500">✗ Invalid key format (must start with sk-or-v1-)</span>,
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
         role="dialog" aria-modal="true" aria-label="Settings">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">⚙ Settings</h2>
          <button onClick={onClose} aria-label="Close settings" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">✕</button>
        </div>

        {/* OpenRouter Key */}
        <section>
          <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            OpenRouter API Key <span className="text-xs text-gray-400">(optional — enables cloud models)</span>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="api-key-input"
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder={openRouterKey ? '••••••••••••••••' : 'sk-or-v1-…'}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600
                           bg-white dark:bg-gray-800 text-sm px-3 py-2 pr-10
                           text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                aria-label={showKey ? 'Hide key' : 'Show key'}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm"
              >{showKey ? '🙈' : '👁'}</button>
            </div>
            <button onClick={handleSave} disabled={!keyInput}
                    className="px-3 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium
                               hover:bg-violet-700 disabled:opacity-40 transition">
              Save
            </button>
          </div>
          {openRouterKey && (
            <button onClick={handleClear} className="mt-1 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400">
              Clear saved key
            </button>
          )}
          {statusLabel[keyStatus] && <p className="text-xs mt-1">{statusLabel[keyStatus]}</p>}
        </section>

        {/* Model selector */}
        {(openRouterKey || models.length > 0) && (
          <section>
            <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Cloud Model
            </label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => saveModel(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600
                         bg-white dark:bg-gray-800 text-sm px-3 py-2
                         text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:outline-none"
            >
              <option value="">— Auto-select —</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.context_length?.toLocaleString()} ctx)</option>
              ))}
            </select>
          </section>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Your key is encrypted with AES-256-GCM before storage. It never leaves this device.
        </p>
      </div>
    </div>
  )
}
