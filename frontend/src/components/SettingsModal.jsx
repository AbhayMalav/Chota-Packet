import React, { useState, useCallback, useEffect } from 'react'

export default function SettingsModal({ onClose, settings }) {
  const { openRouterKey, saveKey, clearKey, keyStatus, selectedModel, saveModel, models, inferenceMode } = settings
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

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const statusLabel = {
    idle: null,
    saving: <span className="text-amber-400">Saving…</span>,
    valid: <span className="text-emerald-400">✓ Key saved</span>,
    invalid: <span className="text-red-400">✗ Invalid key format (must start with sk-or-v1-)</span>,
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center glass-overlay animate-fade-in"
      role="dialog" aria-modal="true" aria-label="Settings"
    >
      <div
        className="relative rounded-2xl max-w-md w-full mx-4 p-7 flex flex-col gap-5 animate-fade-in gradient-border"
        style={{ background: 'rgba(17,17,32,0.95)', backdropFilter: 'blur(24px)', border: '1px solid rgba(127,19,236,0.2)' }}
      >
        {/* Subtle inner glow */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none"
             style={{ boxShadow: 'inset 0 0 60px rgba(127,19,236,0.04)' }} aria-hidden="true" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
            <span className="text-purple-400">⚙️</span> Settings
          </h2>
          <button onClick={onClose} aria-label="Close settings"
                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-all text-lg">
            ✕
          </button>
        </div>

        {/* Thin divider */}
        <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(127,19,236,0.3), transparent)' }} />

        {/* ── Inference Mode ── */}
        <section className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Inference Mode
          </label>
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-black/20 border border-purple-500/15">
            <span className={`text-base ${inferenceMode === 'cloud' ? 'text-blue-400' : 'text-emerald-400'}`}>
              {inferenceMode === 'cloud' ? '☁️' : '🏠'}
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-200">
                {inferenceMode === 'cloud' ? 'Cloud (OpenRouter)' : 'Local (mT5)'}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Mode is determined by your API key and selected model below.
              </p>
            </div>
          </div>
        </section>

        {/* ── API Key ── */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="api-key-input" className="text-xs font-bold uppercase tracking-widest text-gray-500">
              OpenRouter API Key
            </label>
            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer"
               className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors">
              Get Key →
            </a>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="api-key-input"
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder={openRouterKey ? '••••••••••••••••' : 'sk-or-v1-…'}
                className="w-full rounded-full border border-purple-500/15 bg-[var(--theme-input-bg)]
                           text-sm px-4 py-2.5 pr-10 text-[var(--theme-input-text)] min-h-[44px]
                           focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/25
                           focus:bg-[var(--theme-input-bg-focus)]
                           transition-all duration-200"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                aria-label={showKey ? 'Hide key' : 'Show key'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500
                           hover:text-purple-400 text-sm transition-colors"
              >{showKey ? '🙈' : '👁'}</button>
            </div>
            <button
              onClick={handleSave}
              disabled={!keyInput}
              className="px-4 py-2 rounded-full gradient-brand text-white text-sm font-semibold
                         shadow-md shadow-purple-500/20 hover:shadow-purple-500/35 min-h-[44px]
                         disabled:opacity-25 disabled:shadow-none transition-all duration-200"
            >
              Save
            </button>
          </div>
          {openRouterKey && (
            <button onClick={handleClear}
                    className="text-[11px] text-red-500 hover:text-red-400 font-medium self-start transition-colors">
              Clear saved key
            </button>
          )}
          {statusLabel[keyStatus] && <p className="text-xs">{statusLabel[keyStatus]}</p>}
        </section>

        {/* ── Cloud Model ── */}
        {(openRouterKey || models?.length > 0) && (
          <section className="flex flex-col gap-2">
            <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(127,19,236,0.2), transparent)' }} />
            <label htmlFor="model-select" className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Cloud Model
            </label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => saveModel(e.target.value)}
              className="w-full rounded-full border border-purple-500/15 bg-[var(--theme-input-bg)] text-sm px-4 py-2.5 min-h-[44px]
                         text-[var(--theme-input-text)] focus:outline-none focus:border-purple-500/40 focus:bg-[var(--theme-input-bg-focus)]
                         cursor-pointer transition-all duration-200 hover:border-purple-500/30 hover:bg-[var(--theme-input-bg-hover)]"
            >
              <option value="" className="bg-[var(--theme-option-bg)]">— Auto-select —</option>
              {models?.map((m) => (
                <option key={m.id} value={m.id} className="bg-[var(--theme-option-bg)]">
                  {m.name}{m.context_length ? ` (${m.context_length.toLocaleString()} ctx)` : ''}
                </option>
              ))}
            </select>
          </section>
        )}

        {/* ── Keyboard shortcuts ── */}
        <section className="flex flex-col gap-2">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(127,19,236,0.2), transparent)' }} />
          <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Shortcuts
          </label>
          <div className="flex flex-col gap-1.5">
            {[['Ctrl+Enter','Enhance'], ['Esc','Close panels'], ['Ctrl+Shift+C','Copy output']].map(([key, action]) => (
              <div key={key} className="flex items-center justify-between text-[11px]">
                <kbd className="px-2 py-0.5 rounded-md border text-[var(--theme-input-text)] font-mono"
                     style={{ backgroundColor: 'var(--theme-kbd-bg)', borderColor: 'var(--theme-kbd-border)' }}>
                  {key}
                </kbd>
                <span className="text-gray-600">{action}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Security note */}
        <p className="text-[11px] text-gray-600 leading-relaxed flex items-start gap-1.5">
          <span className="text-purple-400/70 mt-0.5">🔒</span>
          Your API key is encrypted before storage and never leaves your device.
        </p>
      </div>
    </div>
  )
}
