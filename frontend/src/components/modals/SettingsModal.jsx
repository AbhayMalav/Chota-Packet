import React, { useState, useCallback, useEffect } from 'react'
import { Settings, Plug, Key, Cpu, Keyboard, ArrowRight, X, Eye, EyeOff, Layers, Plus, Minus } from 'lucide-react'
import useTranslation from '../../hooks/useTranslation'
import { useTheme } from '../../context/ThemeContext'
import { STYLES, TONES, LEVELS, OUT_LANGS, LS_MULTI_OUTPUT, LS_MULTI_CONFIGS } from '../../config/constants'
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
  const { t } = useTranslation()

  const [keyInput, setKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  // Multi-output state
  const [multiOutputEnabled, setMultiOutputEnabled] = useState(() => {
    return localStorage.getItem(LS_MULTI_OUTPUT) === 'true'
  })
  const defaultConfigs = [
    { tone: '', level: 'basic', style: 'general', outputLang: 'auto' },
    { tone: '', level: 'detailed', style: 'creative', outputLang: 'auto' },
  ]
  const safeParseConfigs = (saved) => {
    try {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return parsed
      localStorage.removeItem(LS_MULTI_CONFIGS)
      return defaultConfigs
    } catch (e) {
      localStorage.removeItem(LS_MULTI_CONFIGS)
      return defaultConfigs
    }
  }
  const [multiOutputCount, setMultiOutputCount] = useState(() => {
    const saved = localStorage.getItem(LS_MULTI_CONFIGS)
    return saved ? safeParseConfigs(saved).length : 2
  })
  const [multiConfigs, setMultiConfigs] = useState(() => {
    const saved = localStorage.getItem(LS_MULTI_CONFIGS)
    return saved ? safeParseConfigs(saved) : defaultConfigs
  })

  // Persist multi-output settings
  useEffect(() => {
    localStorage.setItem(LS_MULTI_OUTPUT, String(multiOutputEnabled))
  }, [multiOutputEnabled])

  useEffect(() => {
    localStorage.setItem(LS_MULTI_CONFIGS, JSON.stringify(multiConfigs))
  }, [multiConfigs])

  const handleConfigChange = useCallback((index, field, value) => {
    setMultiConfigs(prev => prev.map((cfg, i) => 
      i === index ? { ...cfg, [field]: value } : cfg
    ))
  }, [])

  const handleCountChange = useCallback((delta) => {
    setMultiOutputCount(prev => {
      const newCount = Math.min(4, Math.max(2, prev + delta))
      setMultiConfigs(prev => {
        const newConfigs = [...prev]
        while (newConfigs.length < newCount) {
          newConfigs.push({ tone: '', level: 'basic', style: 'general', outputLang: 'auto' })
        }
        while (newConfigs.length > newCount) {
          newConfigs.pop()
        }
        return newConfigs
      })
      return newCount
    })
  }, [])

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

        {/* Multi-Output Mode */}
        <SectionLabel icon={<Layers size={14} />} label={t.multiOutputMode || 'Multi-Output Mode'} sublabel={t.multiOutputModeSublabel || 'Generate multiple enhanced prompts at once'} />
        
        <div className="flex items-center justify-between px-3.5 py-3 rounded-xl border border-white/10 mb-3">
          <div>
            <p className="text-theme text-sm font-semibold">{t.enableMultiOutput || 'Enable Multi-Output'}</p>
            <p className="text-secondary text-[11px] mt-0.5">
              {(t.generatePrompts || 'Generate {count} prompts with different settings').replace('{count}', multiOutputCount)}
            </p>
          </div>
          <button
            onClick={() => setMultiOutputEnabled(v => !v)}
            role="switch"
            aria-checked={multiOutputEnabled}
            aria-label={multiOutputEnabled ? (t.disableMultiOutput || 'Disable multi-output') : (t.enableMultiOutput || 'Enable multi-output')}
            className="w-11 h-6 rounded-full transition-all duration-200 relative"
            style={{
              backgroundColor: multiOutputEnabled ? 'var(--theme-toggle-on-bg)' : 'var(--theme-toggle-off-bg)',
            }}
          >
            <span className="absolute top-1 w-4 h-4 rounded-full transition-all duration-200" style={{ left: multiOutputEnabled ? '22px' : '4px', backgroundColor: 'var(--theme-toggle-on-knob)' }} />
          </button>
        </div>

        {multiOutputEnabled && (
          <div className="space-y-3">
            {/* Count selector */}
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl border border-white/10">
              <span className="text-theme text-sm font-medium">{t.numberOfOutputs || 'Number of outputs'}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCountChange(-1)}
                  disabled={multiOutputCount <= 2}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 transition-all"
                >
                  <Minus size={14} />
                </button>
                <span className="text-theme font-semibold w-6 text-center">{multiOutputCount}</span>
                <button
                  onClick={() => handleCountChange(1)}
                  disabled={multiOutputCount >= 4}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 transition-all"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Per-card configurations */}
            <div className="space-y-2">
              <p className="text-secondary text-[11px] font-medium uppercase tracking-wider">{t.cardConfigurations || 'Card Configurations'}</p>
              {multiConfigs.map((cfg, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-white/10 bg-white/5">
                  <p className="text-theme text-xs font-semibold mb-2">{(t.cardNumber || 'Card #{n}').replace('{n}', idx + 1)}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={cfg.style}
                      onChange={(e) => handleConfigChange(idx, 'style', e.target.value)}
                      className="bg-input text-theme text-[11px] rounded-lg border border-purple-500/20 px-2 py-1.5 outline-none"
                    >
                      {STYLES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <select
                      value={cfg.tone}
                      onChange={(e) => handleConfigChange(idx, 'tone', e.target.value)}
                      className="bg-input text-theme text-[11px] rounded-lg border border-purple-500/20 px-2 py-1.5 outline-none"
                    >
                      {TONES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <select
                      value={cfg.level}
                      onChange={(e) => handleConfigChange(idx, 'level', e.target.value)}
                      className="bg-input text-theme text-[11px] rounded-lg border border-purple-500/20 px-2 py-1.5 outline-none"
                    >
                      {LEVELS.filter(l => !['chain_of_thought', 'meta', 'prompt_chaining', 'multi_prompt_fusion', 'soft_prompting'].includes(l.value)).map(l => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                    <select
                      value={cfg.outputLang}
                      onChange={(e) => handleConfigChange(idx, 'outputLang', e.target.value)}
                      className="bg-input text-theme text-[11px] rounded-lg border border-purple-500/20 px-2 py-1.5 outline-none"
                    >
                      {OUT_LANGS.map(l => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
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