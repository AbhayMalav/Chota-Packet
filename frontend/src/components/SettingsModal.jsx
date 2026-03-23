import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  GearIcon, PlugIcon, KeyIcon, CpuIcon,
  KeyboardIcon, ShieldIcon, ArrowRightIcon,
  XIcon, EyeIcon, EyeOffIcon,
} from './icons'
import '../styles/components/SettingsModal.css'


const STATUS_META = {
  saving: { text: 'Saving…', className: 'text-amber-400' },
  valid: { text: 'Key saved successfully', className: 'text-emerald-400' },
  invalid: { text: 'Invalid format - must start with sk-or-v1-', className: 'text-red-400' },
}


// ── Small reusable pieces ──────────────────────────────────────────────────────


function SectionLabel({ icon, label, sublabel }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span className="settings__section-icon flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center">
        {icon}
      </span>
      <div>
        <p className="text-muted text-xs font-bold uppercase tracking-widest leading-none">
          {label}
        </p>
        {sublabel && (
          <p className="text-secondary text-[11px] mt-0.5">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  )
}


function Divider() {
  return <div className="settings__divider" />
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
      <div className="settings__container relative flex flex-col glass-card gradient-border rounded-2xl w-full max-w-md mx-auto overflow-hidden">

        {/* Inner glow */}
        <div className="settings__card-glow" aria-hidden="true" />

        {/* ── Header ── */}
        <div className="settings__header flex items-center justify-between px-5 py-4 flex-shrink-0 border-b">
          <div className="flex items-center gap-3">
            <span className="settings__header-icon w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0">
              <GearIcon className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-theme text-sm font-bold">Settings</h2>
              <p className="text-secondary text-[11px]">Backend · API key · Preferences</p>
            </div>
          </div>

          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close settings"
            className="btn-icon w-8 h-8 min-w-0 min-h-0 rounded-lg"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="settings__body flex-1 overflow-y-auto px-5 py-5">

          {/* ── Inference Mode ── */}
          <section>
            <SectionLabel
              icon={<PlugIcon className="w-3.5 h-3.5" />}
              label="Inference Mode"
              sublabel="Determined by your API key and model"
            />

            <div className={`settings__mode-row--${isCloud ? 'cloud' : 'local'} flex items-center justify-between px-3.5 py-3 rounded-xl border`}>
              <div>
                <p className="text-theme text-sm font-semibold">
                  {isCloud ? 'Cloud - OpenRouter' : 'Local - mT5'}
                </p>
                <p className="text-secondary text-[11px] mt-0.5">
                  {isCloud ? 'Requests routed via OpenRouter API' : 'No data leaves your device'}
                </p>
              </div>

              <span className={`settings__mode-badge--${isCloud ? 'cloud' : 'local'} flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-3`}>
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
                  className="bg-input text-theme w-full rounded-xl border border-purple-500/15 text-sm
                             px-3.5 py-2.5 pr-9 min-h-[42px]
                             focus:outline-none focus:border-purple-500/40
                             focus:ring-1 focus:ring-purple-500/20
                             transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((s) => !s)}
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                  className="text-secondary absolute right-2.5 top-1/2 -translate-y-1/2
                             transition-colors p-0.5 rounded"
                >
                  {showKey ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
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
                className={`flex items-center gap-1.5 text-xs font-medium px-1 mb-2 ${statusMeta.className}`}
                aria-live="polite"
                aria-atomic="true"
              >
                {statusMeta.text}
              </div>
            )}

            {/* Key saved row */}
            {openRouterKey && (
              <div className={`settings__key-saved-row${confirmClear ? ' settings__key-saved-row--confirm' : ''} flex items-center justify-between px-3.5 py-2.5 rounded-xl border mt-1`}>
                <span className="text-muted text-[11px] font-medium">
                  {confirmClear ? 'This will remove your saved key' : 'A key is currently saved'}
                </span>
                <button
                  data-clear-btn
                  onClick={handleClear}
                  aria-label={confirmClear ? 'Confirm: clear saved key' : 'Clear saved key'}
                  className={`settings__clear-btn${confirmClear ? ' settings__clear-btn--confirm' : ''} text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all duration-200 ml-3 flex-shrink-0`}
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
                  className="settings__model-select bg-input text-theme w-full rounded-xl border border-purple-500/15 text-sm
                             px-3.5 py-2.5 min-h-[42px]
                             focus:outline-none focus:border-purple-500/40
                             focus:ring-1 focus:ring-purple-500/20
                             cursor-pointer transition-all duration-200
                             hover:border-purple-500/25"
                >
                  <option value="">Auto-select best model</option>
                  {models?.map((m) => (
                    <option key={m.id} value={m.id}>
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
              className="settings__shortcuts-btn bg-input w-full flex items-center justify-between px-3.5 py-3 rounded-xl
                         border transition-all duration-200 group
                         hover:border-purple-500/30"
            >
              <span className="text-theme text-sm font-medium">View all shortcuts</span>
              <ArrowRightIcon
                className="text-secondary w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </button>
          </section>
        </div>

        {/* ── Footer - security note ── */}
        <div className="settings__footer flex items-center gap-2.5 px-5 py-3 flex-shrink-0 border-t">
          <ShieldIcon className="text-purple-400 w-3.5 h-3.5 flex-shrink-0" />
          <p className="text-secondary text-[11px] leading-relaxed">
            Your API key is encrypted before storage and never leaves your device.
          </p>
        </div>

      </div>
    </div>
  )
}
