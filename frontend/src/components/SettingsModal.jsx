import React, { useState, useCallback, useEffect, useRef } from 'react'

const STATUS_LABELS = {
  idle:    null,
  saving:  <span style={{ color: '#fbbf24' }}>Saving…</span>,
  valid:   <span style={{ color: '#34d399' }}>✓ Key saved</span>,
  invalid: <span style={{ color: '#f87171' }}>✗ Invalid key format (must start with sk-or-v1-)</span>,
}

export default function SettingsModal({ onClose = () => {}, settings, onShowShortcuts = () => {} }) {
  const dialogRef   = useRef(null)
  const closeBtnRef = useRef(null)

  // All hooks must run unconditionally — guard comes AFTER hooks
  const [keyInput,      setKeyInput]      = useState('')
  const [showKey,       setShowKey]       = useState(false)
  const [confirmClear,  setConfirmClear]  = useState(false)

  const handleSave = useCallback(async () => {
    if (!keyInput.trim()) return
    await settings?.saveKey(keyInput.trim())
    setKeyInput('')
  }, [keyInput, settings])

  const handleClear = useCallback(() => {
    if (!confirmClear) { setConfirmClear(true); return }
    settings?.clearKey()
    setKeyInput('')
    setConfirmClear(false)
  }, [confirmClear, settings])

  const handleDisarmClear = useCallback((e) => {
    if (confirmClear && !e.target.closest('[data-clear-btn]')) {
      setConfirmClear(false)
    }
  }, [confirmClear])

  // Focus trap
  useEffect(() => {
    if (!settings) return        // safe to guard inside useEffect
    closeBtnRef.current?.focus()

    const dialog = dialogRef.current
    if (!dialog) return

    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ')

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key !== 'Tab') return
      const focusable = Array.from(dialog.querySelectorAll(focusableSelectors))
      if (!focusable.length) return
      const first = focusable[0]
      const last  = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus() }
      }
    }

    dialog.addEventListener('keydown', handleKeyDown)
    return () => dialog.removeEventListener('keydown', handleKeyDown)
  }, [onClose, settings])

  // ── Guard AFTER all hooks ──────────────────────────────────────────────────
  if (!settings) {
    if (import.meta.env.DEV) {
      console.warn('[SettingsModal] settings prop is undefined — modal will not render.')
    }
    return null
  }

  const {
    openRouterKey, keyStatus,
    selectedModel, saveModel, models, inferenceMode,
  } = settings

  const statusNode = (() => {
    if (!keyStatus || keyStatus === 'idle') return null
    if (keyStatus in STATUS_LABELS) return STATUS_LABELS[keyStatus]
    if (import.meta.env.DEV) {
      console.warn(`[SettingsModal] Unrecognised keyStatus: "${keyStatus}"`)
    }
    return null
  })()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center glass-overlay animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      ref={dialogRef}
      onClick={handleDisarmClear}
    >
      <div className="relative rounded-2xl max-w-md w-full mx-4 p-7 flex flex-col gap-5 animate-fade-in glass-card gradient-border">

        {/* Inner glow */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ boxShadow: 'inset 0 0 60px rgba(127,19,236,0.04)' }}
          aria-hidden="true"
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2
            className="text-lg font-bold flex items-center gap-2"
            style={{ color: 'var(--theme-text)' }}
          >
            <span aria-hidden="true">⚙️</span> Settings
          </h2>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close settings"
            className="p-1.5 rounded-lg text-lg transition-all hover:bg-white/5"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            ✕
          </button>
        </div>

        <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(127,19,236,0.3), transparent)' }} />

        {/* ── Inference Mode ── */}
        <section className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--theme-text-secondary)' }}>
            Inference Mode
          </label>
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-purple-500/15"
               style={{ background: 'rgba(0,0,0,0.2)' }}>
            <span className={`text-base ${inferenceMode === 'cloud' ? 'text-blue-400' : 'text-emerald-400'}`}
                  aria-hidden="true">
              {inferenceMode === 'cloud' ? '☁️' : '🏠'}
            </span>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>
                {inferenceMode === 'cloud' ? 'Cloud (OpenRouter)' : 'Local (mT5)'}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
                Mode is determined by your API key and selected model below.
              </p>
            </div>
          </div>
        </section>

        {/* ── API Key ── */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="api-key-input"
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
              OpenRouter API Key
            </label>
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors"
            >
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
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder={openRouterKey ? '••••••••••••••••' : 'sk-or-v1-…'}
                autoComplete="off"
                className="w-full rounded-full border border-purple-500/15 text-sm
                           px-4 py-2.5 pr-10 min-h-[44px]
                           focus:outline-none focus:border-purple-500/40
                           focus:ring-1 focus:ring-purple-500/25
                           focus:bg-[var(--theme-input-bg-focus)]
                           transition-all duration-200"
                style={{
                  background: 'var(--theme-input-bg)',
                  color: 'var(--theme-text)',        // fixed: --theme-input-text does not exist
                }}
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm transition-colors"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                {showKey ? '🙈' : '👁'}
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={!keyInput.trim()}       // fixed: trim() prevents whitespace-only saves
              className="px-4 py-2 rounded-full gradient-brand text-white text-sm font-semibold
                         shadow-md shadow-purple-500/20 hover:shadow-purple-500/35 min-h-[44px]
                         disabled:opacity-25 disabled:shadow-none transition-all duration-200"
            >
              Save
            </button>
          </div>

          {/* Two-step clear confirmation — prevents accidental key deletion */}
          {openRouterKey && (
            <button
              data-clear-btn
              onClick={handleClear}
              className="text-[11px] font-medium self-start transition-colors"
              style={{ color: confirmClear ? '#f87171' : '#ef4444' }}
              aria-label={confirmClear ? 'Confirm: clear saved key' : 'Clear saved key'}
            >
              {confirmClear ? '⚠ Click again to confirm clear' : 'Clear saved key'}
            </button>
          )}

          {/* aria-live announces status changes to screen readers */}
          <p className="text-xs" aria-live="polite" aria-atomic="true">
            {statusNode}
          </p>
        </section>

        {/* ── Cloud Model ── */}
        {(openRouterKey || models?.length > 0) && (
          <section className="flex flex-col gap-2">
            <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(127,19,236,0.2), transparent)' }} />
            <label
              htmlFor="model-select"
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
              Cloud Model
            </label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => saveModel(e.target.value)}
              className="w-full rounded-full border border-purple-500/15 text-sm px-4 py-2.5
                         min-h-[44px] focus:outline-none focus:border-purple-500/40
                         focus:bg-[var(--theme-input-bg-focus)] cursor-pointer
                         transition-all duration-200 hover:border-purple-500/30
                         hover:bg-[var(--theme-input-bg-hover)]"
              style={{
                background: 'var(--theme-input-bg)',
                color: 'var(--theme-text)',           // fixed: --theme-input-text does not exist
              }}
            >
              <option value="" style={{ background: 'var(--theme-option-bg)' }}>
                — Auto-select —
              </option>
              {models?.map((m) => (
                <option key={m.id} value={m.id} style={{ background: 'var(--theme-option-bg)' }}>
                  {m.name}{m.context_length ? ` (${m.context_length.toLocaleString()} ctx)` : ''}
                </option>
              ))}
            </select>
          </section>
        )}

        {/* ── Keyboard Shortcuts ── */}
        <section className="flex flex-col gap-2">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(127,19,236,0.2), transparent)' }} />
          <div className="flex items-center justify-between">
            <label
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
              Shortcuts
            </label>
            <button
              onClick={onShowShortcuts}
              className="text-[11px] px-3 py-1.5 rounded-full border border-purple-500/20
                         text-purple-400 font-medium hover:bg-purple-500/10
                         hover:border-purple-500/40 transition-all duration-200"
            >
              Show Shortcuts
            </button>
          </div>
        </section>

        {/* Security note */}
        <p
          className="text-[11px] leading-relaxed flex items-start gap-1.5"
          style={{ color: 'var(--theme-text-secondary)' }}
        >
          <span className="text-purple-400/70 mt-0.5" aria-hidden="true">🔒</span>
          Your API key is encrypted before storage and never leaves your device.
        </p>
      </div>
    </div>
  )
}
