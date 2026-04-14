import React, { useState, useCallback } from 'react'
import { Settings, Plug, Key, Cpu, Keyboard, ArrowRight, X, Eye, EyeOff } from 'lucide-react'
import { translations } from '../../config/translations'
import { useTheme } from '../../context/ThemeContext'
import './SettingsPanel.css'

const STATUS_META = {
  saving: { textKey: 'saving', className: 'text-amber-400' },
  valid: { textKey: 'valid', className: 'text-emerald-400' },
  invalid: { textKey: 'invalid', className: 'text-red-400' }
}

function SectionLabel({ icon, label, sublabel }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span className="settings__section-icon flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center">
        {icon}
      </span>
      <div>
        <p className="text-muted text-xs font-bold uppercase tracking-widest leading-none">{label}</p>
        {sublabel && <p className="text-secondary text-[11px] mt-0.5">{sublabel}</p>}
      </div>
    </div>
  )
}

function Divider() {
  return <div className="settings__divider my-4 border-t border-white/5" />
}

export default function SettingsPanel({ onClose, settings, onShowShortcuts }) {
  const { language } = useTheme()
  const t = translations[language] || translations.en

  const [keyInput, setKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const handleSave = useCallback(async () => {
    if (!keyInput.trim()) return
    await settings?.saveKey(keyInput.trim())
    setKeyInput('')
  }, [keyInput, settings])

  const handleClear = useCallback(() => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    settings?.clearKey()
    setKeyInput('')
    setConfirmClear(false)
  }, [confirmClear, settings])

  if (!settings) return null

  const { openRouterKey, keyStatus, selectedModel, saveModel, models, inferenceMode } = settings
  const isCloud = inferenceMode === 'cloud'
  const statusMeta = keyStatus && keyStatus !== 'idle' ? STATUS_META[keyStatus] : null

  const getStatusText = (key) => {
    const texts = {
      saving: t.loading || 'Saving...',
      valid: t.keySaved || 'Key saved successfully',
      invalid: t.keyInvalid || 'Invalid format - must start with sk-or-v1-'
    }
    return texts[key] || key
  }

  return (
    <div className="settings__container relative flex flex-col w-full max-h-[85vh] bg-transparent">
      {/* Header */}
      <div className="settings__header flex items-center justify-between px-5 py-4 flex-shrink-0 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="settings__header-icon w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/5">
            <Settings size={16} />
          </span>
          <div>
            <h2 className="text-theme text-sm font-bold">{t.settings}</h2>
            <p className="text-secondary text-[11px]">{t.preferences}</p>
          </div>
        </div>
        <button onClick={onClose} aria-label={t.close} className="btn-icon w-8 h-8 rounded-lg">
            <X size={16} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="settings__body overflow-y-auto px-5 py-5">
        
        {/* Inference Mode */}
        <SectionLabel icon={<Plug size={14} />} label={t.inferenceMode || 'Inference Mode'} sublabel={t.determinedByApiKey || 'Determined by your API key'} />
        <div className={`settings__mode-row ${isCloud ? 'cloud' : 'local'} flex items-center justify-between px-3.5 py-3 rounded-xl border border-white/10`}>
          <div>
            <p className="text-theme text-sm font-semibold">{isCloud ? t.cloudOpenRouter || 'Cloud - OpenRouter' : t.localMT5 || 'Local - mT5'}</p>
            <p className="text-secondary text-[11px] mt-0.5">
              {isCloud ? t.requestsRoutedViaOpenRouter || 'Requests routed via OpenRouter API' : t.noDataLeavesDevice || 'No data leaves your device'}
            </p>
          </div>
        </div>

        <Divider />

        {/* API Key */}
        <div className="flex items-start justify-between mb-3">
          <SectionLabel icon={<Key size={14} />} label={t.apiKey} />
          <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-[11px] font-medium flex items-center gap-1 text-purple-400 hover:text-purple-300">
            {t.getFreeKey || 'Get free key'} <ArrowRight size={12} />
          </a>
        </div>
        
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <input
              type={showKey ? "text" : "password"}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder={openRouterKey ? t.keySaved : 'sk-or-v1-...'}
              className="bg-input text-theme w-full rounded-xl border border-purple-500/15 text-sm px-3.5 py-2.5 pr-9 focus:outline-none focus:border-purple-500/40"
            />
            <button type="button" onClick={() => setShowKey(s => !s)} className="text-secondary absolute right-2.5 top-1/2 -translate-y-1/2">
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button onClick={handleSave} disabled={!keyInput.trim()} className="px-4 rounded-xl gradient-brand text-white text-xs font-bold disabled:opacity-25">
            {t.save}
          </button>
        </div>

        {statusMeta && (
          <div className={`text-xs font-medium mb-2 ${statusMeta.className}`} aria-live="polite">
            {getStatusText(statusMeta.textKey)}
          </div>
        )}

        {openRouterKey && (
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-white/10 mt-1">
            <span className="text-muted text-[11px] font-medium">
              {confirmClear ? t.confirmClear : t.clearKey}
            </span>
            <button onClick={handleClear} className="text-red-400 hover:text-red-300 text-[11px] font-semibold px-2.5 py-1">
              {confirmClear ? t.confirmClear : t.clear}
            </button>
          </div>
        )}

        {openRouterKey && models?.length > 0 && (
          <>
            <Divider />
            <SectionLabel icon={<Cpu size={14} />} label={t.model} />
            <select
              value={selectedModel}
              onChange={(e) => saveModel(e.target.value)}
              className="bg-input text-theme w-full rounded-xl border border-purple-500/15 text-sm px-3.5 py-2.5 outline-none"
            >
              <option value="">{t.selectModel}</option>
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </>
        )}

        <Divider />

        <SectionLabel icon={<Keyboard size={14} />} label={t.keyboardShortcuts} />
        <button onClick={onShowShortcuts} className="bg-input w-full flex items-center justify-between px-3.5 py-3 rounded-xl border border-white/10 hover:border-purple-500/30 transition-all text-left">
          <span className="text-theme text-sm font-semibold">{t.shortcuts}</span>
          <ArrowRight size={16} className="text-secondary" />
        </button>
      </div>
    </div>
  )
}