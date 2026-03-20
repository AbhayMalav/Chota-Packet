import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  GearIcon, PlugIcon, KeyIcon, CpuIcon,
  KeyboardIcon, ShieldIcon, ArrowRightIcon,
} from './icons'

const STATUS_META = {
  saving: { text: 'Saving…', color: '#fbbf24' },
  valid: { text: 'Key saved successfully', color: '#34d399' },
  invalid: { text: 'Invalid format - must start with sk-or-v1-', color: '#f87171' },
}

// ── Small reusable pieces ──────────────────────────────────────────────────────

function SectionLabel({ icon, label, sublabel }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span
        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
        style={{
          background: 'rgba(127,19,236,0.12)',
          border: '1px solid rgba(127,19,236,0.22)',
          color: '#a855f7',
        }}
      >
        {icon}
      </span>
      <div>
        <p
          className="text-xs font-bold uppercase tracking-widest leading-none"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          {label}
        </p>
        {sublabel && (
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
            {sublabel}
          </p>
        )}
      </div>
    </div>
  )
}

function Divider() {
  return (
    <div
      className="h-px my-5"
      style={{ background: 'linear-gradient(90deg, transparent, rgba(127,19,236,0.18), transparent)' }}
    />
  )
}

// ── Main modal ─────────────────────────────────────────────────────────────────

export default function SettingsModal({ onClose = () => { }, settings, onShowShortcuts = () => { } }) {
  const dialogRef = useRef(null)
  const closeBtnRef = useRef(null)

  const [keyInput, setKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

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
    if (!settings) return
    closeBtnRef.current?.focus()
    const dialog = dialogRef.current
    if (!dialog) return

    const sel = [
      'button:not([disabled])', 'a[href]',
      'input:not([disabled])', 'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ')

    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key !== 'Tab') return
      const els = Array.from(dialog.querySelectorAll(sel))
      if (!els.length) return
      const first = els[0], last = els[els.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    dialog.addEventListener('keydown', onKey)
    return () => dialog.removeEventListener('keydown', onKey)
  }, [onClose, settings])

  // Guard after hooks
  if (!settings) {
    if (import.meta.env.DEV) console.warn('[SettingsModal] settings prop is undefined')
    return null
  }

  const { openRouterKey, keyStatus, selectedModel, saveModel, models, inferenceMode } = settings
  const isCloud = inferenceMode === 'cloud'

  const statusMeta = (() => {
    if (!keyStatus || keyStatus === 'idle') return null
    if (keyStatus in STATUS_META) return STATUS_META[keyStatus]
    if (import.meta.env.DEV) console.warn(`[SettingsModal] Unknown keyStatus: "${keyStatus}"`)
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
      <div
        className="relative flex flex-col glass-card gradient-border rounded-2xl w-full mx-4 overflow-hidden"
        style={{ maxWidth: '480px', maxHeight: '88vh' }}
      >
        {/* Inner glow */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ boxShadow: 'inset 0 0 80px rgba(127,19,236,0.04)' }}
          aria-hidden="true"
        />

        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b"
          style={{ borderColor: 'rgba(127,19,236,0.12)' }}
        >
          <div className="flex items-center gap-3">
            <span
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(127,19,236,0.15)',
                border: '1px solid rgba(127,19,236,0.28)',
                color: '#a855f7',
              }}
            >
              <GearIcon className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--theme-text)' }}>
                Settings
              </h2>
              <p className="text-[11px]" style={{ color: 'var(--theme-text-secondary)' }}>
                Backend · API key · Preferences
              </p>
            </div>
          </div>

          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close settings"
            className="btn-icon w-8 h-8 min-w-0 min-h-0 rounded-lg"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5" style={{ scrollbarWidth: 'thin' }}>

          {/* ── Inference Mode ── */}
          <section>
            <SectionLabel
              icon={<PlugIcon className="w-3.5 h-3.5" />}
              label="Inference Mode"
              sublabel="Determined by your API key and model"
            />

            <div
              className="flex items-center justify-between px-3.5 py-3 rounded-xl border"
              style={{
                background: isCloud ? 'rgba(59,130,246,0.05)' : 'rgba(16,185,129,0.05)',
                borderColor: isCloud ? 'rgba(59,130,246,0.18)' : 'rgba(16,185,129,0.18)',
              }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>
                  {isCloud ? 'Cloud - OpenRouter' : 'Local - mT5'}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
                  {isCloud ? 'Requests routed via OpenRouter API' : 'No data leaves your device'}
                </p>
              </div>

              <span
                className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-3"
                style={{
                  background: isCloud ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
                  color: isCloud ? '#60a5fa' : '#34d399',
                }}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 animate-dot-pulse ${isCloud ? 'bg-blue-400' : 'bg-emerald-400'}`}
                  aria-hidden="true"
                />
                {isCloud ? 'Cloud' : 'Local'}
              </span>
            </div>
          </section>

          <Divider />

          {/* ── API Key ── */}
          <section>
            <div className="flex items-start justify-between mb-3">
              <SectionLabel
                icon={<KeyIcon className="w-3.5 h-3.5" />}
                label="OpenRouter API Key"
              />
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium flex items-center gap-1 mt-0.5 flex-shrink-0
                           text-purple-400 hover:text-purple-300 transition-colors"
              >
                Get free key
                <ArrowRightIcon className="w-3 h-3" />
              </a>
            </div>

            {/* Input row */}
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <input
                  id="api-key-input"
                  type={showKey ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  placeholder={openRouterKey ? '•••••••• key already saved' : 'sk-or-v1-…'}
                  autoComplete="off"
                  className="w-full rounded-xl border border-purple-500/15 text-sm
                             px-3.5 py-2.5 pr-9 min-h-[42px]
                             focus:outline-none focus:border-purple-500/40
                             focus:ring-1 focus:ring-purple-500/20
                             transition-all duration-200"
                  style={{ background: 'var(--theme-input-bg)', color: 'var(--theme-text)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((s) => !s)}
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2
                             transition-colors p-0.5 rounded"
                  style={{ color: 'var(--theme-text-secondary)' }}
                >
                  {showKey
                    ? <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true"><path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" /><path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" /></svg>
                    : <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                  }
                </button>
              </div>

              <button
                onClick={handleSave}
                disabled={!keyInput.trim()}
                className="flex-shrink-0 px-4 rounded-xl gradient-brand text-white
                           text-xs font-bold min-h-[42px] min-w-[72px]
                           shadow-sm shadow-purple-500/20
                           hover:shadow-md hover:shadow-purple-500/30
                           disabled:opacity-25 disabled:shadow-none
                           transition-all duration-200"
              >
                Save
              </button>
            </div>

            {/* Status message */}
            {statusMeta && (
              <div
                className="flex items-center gap-1.5 text-xs font-medium px-1 mb-2"
                style={{ color: statusMeta.color }}
                aria-live="polite"
                aria-atomic="true"
              >
                {statusMeta.text}
              </div>
            )}

            {/* Key saved row */}
            {openRouterKey && (
              <div
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border mt-1"
                style={{
                  background: 'rgba(0,0,0,0.15)',
                  borderColor: confirmClear
                    ? 'rgba(239,68,68,0.25)'
                    : 'rgba(127,19,236,0.1)',
                }}
              >
                <span className="text-[11px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>
                  {confirmClear ? 'This will remove your saved key' : 'A key is currently saved'}
                </span>
                <button
                  data-clear-btn
                  onClick={handleClear}
                  aria-label={confirmClear ? 'Confirm: clear saved key' : 'Clear saved key'}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all duration-200 ml-3 flex-shrink-0"
                  style={{
                    color: '#f87171',
                    background: confirmClear ? 'rgba(239,68,68,0.12)' : 'transparent',
                    border: confirmClear ? '1px solid rgba(239,68,68,0.25)' : '1px solid transparent',
                  }}
                >
                  {confirmClear ? 'Confirm' : 'Clear'}
                </button>
              </div>
            )}
          </section>

          {/* ── Cloud Model ── */}
          {(openRouterKey || models?.length > 0) && (
            <>
              <Divider />
              <section>
                <SectionLabel
                  icon={<CpuIcon className="w-3.5 h-3.5" />}
                  label="Cloud Model"
                  sublabel="Which OpenRouter model to use"
                />
                <select
                  id="model-select"
                  value={selectedModel}
                  onChange={(e) => saveModel(e.target.value)}
                  className="w-full rounded-xl border border-purple-500/15 text-sm
                             px-3.5 py-2.5 min-h-[42px]
                             focus:outline-none focus:border-purple-500/40
                             focus:ring-1 focus:ring-purple-500/20
                             cursor-pointer transition-all duration-200
                             hover:border-purple-500/25"
                  style={{ background: 'var(--theme-input-bg)', color: 'var(--theme-text)' }}
                >
                  <option value="" style={{ background: 'var(--theme-option-bg)' }}>
                    Auto-select best model
                  </option>
                  {models?.map((m) => (
                    <option key={m.id} value={m.id} style={{ background: 'var(--theme-option-bg)' }}>
                      {m.name}
                      {m.context_length ? ` - ${m.context_length.toLocaleString()} ctx` : ''}
                      {m.cost_per_1k_tokens === 0 ? ' (free)' : ''}
                    </option>
                  ))}
                </select>
              </section>
            </>
          )}

          <Divider />

          {/* ── Keyboard Shortcuts ── */}
          <section>
            <SectionLabel
              icon={<KeyboardIcon className="w-3.5 h-3.5" />}
              label="Keyboard Shortcuts"
            />
            <button
              onClick={onShowShortcuts}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl
                         border transition-all duration-200 group
                         hover:border-purple-500/30"
              style={{
                background: 'var(--theme-input-bg)',
                borderColor: 'rgba(127,19,236,0.12)',
              }}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                View all shortcuts
              </span>
              <ArrowRightIcon
                className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
                style={{ color: 'var(--theme-text-secondary)' }}
              />
            </button>
          </section>
        </div>

        {/* ── Footer - security note ── */}
        <div
          className="flex items-center gap-2.5 px-5 py-3 flex-shrink-0 border-t"
          style={{
            borderColor: 'rgba(127,19,236,0.1)',
            background: 'rgba(0,0,0,0.12)',
          }}
        >
          <ShieldIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#a855f7' }} />
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
            Your API key is encrypted before storage and never leaves your device.
          </p>
        </div>
      </div>
    </div>
  )
}
