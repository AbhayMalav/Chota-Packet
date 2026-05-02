import React, { useState, useRef, useEffect, useCallback } from 'react'
import { STYLES, TONES, LEVELS, OUT_LANGS } from '../../config/constants'
import { SparklesIcon, RegenerateIcon } from '../ui/icons'
import { translations } from '../../config/translations'
import { useTheme } from '../../context/ThemeContext'
import './ControlBar.css'


// ── Spinner (shared by Enhance button) ───────────────────────────────────────
function LoadSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-2a8 8 0 01-8-8z"
      />
    </svg>
  )
}


// ── PillSelect ────────────────────────────────────────────────────────────────
function PillSelect({ id, label, value, onChange, options, disabled, t }) {
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const dropdownRef = useRef(null)
  const optionRefs = useRef([])

  const valueToKey = {
    '': 'noTone',
    'chain_of_thought': 'chainOfThought',
    'prompt_chaining': 'promptChaining',
    'multi_prompt_fusion': 'multiPromptFusion',
    'soft_prompting': 'softPrompting',
  }

  const getTranslatedLabel = (opt) => {
    const key = valueToKey[opt.value] || opt.value
    return t[key] || opt.label
  }

  const selectedIndex = options.findIndex((o) => o.value === value)
  const selectedLabel = selectedIndex >= 0 ? getTranslatedLabel(options[selectedIndex]) : ''

  const openDropdown = useCallback(() => {
    if (disabled) return
    setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }, [disabled, selectedIndex])

  const closeDropdown = useCallback(() => setOpen(false), [])

  const selectOption = useCallback((optValue) => {
    onChange(optValue)
    closeDropdown()
  }, [onChange, closeDropdown])

  useEffect(() => {
    if (!open) return
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        closeDropdown()
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open, closeDropdown])

  useEffect(() => {
    if (open) optionRefs.current[focusedIndex]?.focus()
  }, [open, focusedIndex])

  const handleTriggerKeyDown = (e) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      openDropdown()
    }
  }

  const handleOptionKeyDown = (e, index) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((i) => Math.min(i + 1, options.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((i) => Math.max(i - 1, 0))
        break
      case 'Home':
        e.preventDefault()
        setFocusedIndex(0)
        break
      case 'End':
        e.preventDefault()
        setFocusedIndex(options.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        selectOption(options[index].value)
        break
      case 'Escape':
        e.preventDefault()
        closeDropdown()
        break
      default:
        break
    }
  }

  const listboxId = `${id}-listbox`

  return (
    <div className="pill-select" ref={dropdownRef}>
      <div className={`pill-select__wrapper ${open ? 'pill-select__wrapper--open' : ''}`}>
        <label htmlFor={id} className="pill-select__label">
          {label}
        </label>

        <button
          type="button"
          id={id}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={open ? `${id}-opt-${focusedIndex}` : undefined}
          onClick={() => (open ? closeDropdown() : openDropdown())}
          onKeyDown={handleTriggerKeyDown}
          disabled={disabled}
          className="pill-select__trigger"
        >
          <span className="pill-select__value">{selectedLabel}</span>
          <svg viewBox="0 0 20 20" fill="currentColor" className={`pill-select__chevron ${open ? 'pill-select__chevron--open' : ''}`} aria-hidden="true">
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {open && (
        <div id={listboxId} role="listbox" aria-label={label} className="pill-select__dropdown">
          <div className="pill-select__options">
            {options.map((o, index) => (
              <button
                key={o.value}
                id={`${id}-opt-${index}`}
                role="option"
                aria-selected={o.value === value}
                tabIndex={-1}
                ref={(el) => (optionRefs.current[index] = el)}
                onClick={() => selectOption(o.value)}
                onKeyDown={(e) => handleOptionKeyDown(e, index)}
                className={`pill-select__option ${o.value === value ? 'pill-select__option--selected' : ''}`}
              >
                {getTranslatedLabel(o)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


// ── ModelPill ─────────────────────────────────────────────────────────────────
function ModelPill({ models, selectedModel, onModelChange, loading, t }) {
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const dropdownRef = useRef(null)
  const optionRefs = useRef([])

  const isEmpty = !models || models.length === 0
  const selectedLabel = models?.find((m) => m.id === selectedModel)?.name || t.model
  const truncated = selectedLabel.length > 18 ? selectedLabel.slice(0, 16) + '…' : selectedLabel

  const openDropdown = useCallback(() => {
    if (loading || isEmpty) return
    const idx = models.findIndex((m) => m.id === selectedModel)
    setFocusedIndex(idx >= 0 ? idx : 0)
    setOpen(true)
  }, [loading, isEmpty, models, selectedModel])

  const closeDropdown = useCallback(() => setOpen(false), [])

  const selectModel = useCallback((id) => {
    onModelChange(id)
    closeDropdown()
  }, [onModelChange, closeDropdown])

  useEffect(() => {
    if (!open) return
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        closeDropdown()
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open, closeDropdown])

  useEffect(() => {
    if (open) optionRefs.current[focusedIndex]?.focus()
  }, [open, focusedIndex])

  const handleTriggerKeyDown = (e) => {
    if (loading || isEmpty) return
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      openDropdown()
    }
  }

  const handleOptionKeyDown = (e, index) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((i) => Math.min(i + 1, models.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((i) => Math.max(i - 1, 0))
        break
      case 'Home':
        e.preventDefault()
        setFocusedIndex(0)
        break
      case 'End':
        e.preventDefault()
        setFocusedIndex(models.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        selectModel(models[index].id)
        break
      case 'Escape':
        e.preventDefault()
        closeDropdown()
        break
      default:
        break
    }
  }

  return (
    <div className="model-pill" ref={dropdownRef}>
      <button
        type="button"
        id="model-pill-btn"
        onClick={() => (open ? closeDropdown() : openDropdown())}
        onKeyDown={handleTriggerKeyDown}
        disabled={loading || isEmpty}
        title={isEmpty ? t.noModels : selectedLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="model-pill-listbox"
        className={`model-pill__trigger ${open ? 'model-pill__trigger--open' : ''} ${isEmpty || loading ? 'model-pill__trigger--disabled' : ''}`}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="model-pill__icon" aria-hidden="true">
          <path d="M13 7H7v6h6V7z" />
          <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
        </svg>

        <span className="model-pill__label">{isEmpty ? t.noModels : truncated}</span>

        {!isEmpty && !loading && (
          <svg viewBox="0 0 20 20" fill="currentColor" className={`model-pill__chevron ${open ? 'model-pill__chevron--open' : ''}`} aria-hidden="true">
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {open && Array.isArray(models) && (
        <div id="model-pill-listbox" role="listbox" aria-label={t.selectModel} className="model-pill__dropdown">
          <div className="model-pill__options">
            {models.map((m, index) => (
              <button
                key={m.id}
                id={`model-opt-${index}`}
                role="option"
                aria-selected={m.id === selectedModel}
                tabIndex={-1}
                ref={(el) => (optionRefs.current[index] = el)}
                onClick={() => selectModel(m.id)}
                onKeyDown={(e) => handleOptionKeyDown(e, index)}
                className={`model-pill__option ${m.id === selectedModel ? 'model-pill__option--selected' : ''}`}
              >
                <p className={`model-pill__option-name ${m.id === selectedModel ? 'model-pill__option-name--selected' : ''}`}>
                  {m.name}
                </p>
                {m.context_length && (
                  <p className="model-pill__option-meta">
                    {m.context_length.toLocaleString()} {t.contextLength}
                    {m.cost_per_1k_tokens === 0 && ` ${t.free}`}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


// ── ControlBar ────────────────────────────────────────────────────────────────
export default function ControlBar({
  style, onStyleChange,
  tone, onToneChange,
  level, onLevelChange,
  outputLang, onOutputLangChange,
  onEnhance, onRegenerate,
  loading, canEnhance, showRegen,
  models, selectedModel, onModelChange,
  multiOutputEnabled, onMultiOutputToggle,
}) {
  const { language } = useTheme()
  const t = translations[language] || translations.en

  return (
    <div className="control-bar">
      {/* Pill dropdowns row */}
      <div className="pill-selects-row">
        <PillSelect id="style-select" label={t.style} value={style} onChange={onStyleChange} options={STYLES} disabled={loading} t={t} />
        <PillSelect id="tone-select" label={t.tone} value={tone} onChange={onToneChange} options={TONES} disabled={loading} t={t} />
        <PillSelect id="level-select" label={t.level} value={level} onChange={onLevelChange} options={LEVELS} disabled={loading} t={t} />
        <PillSelect id="outlang-select" label={t.output} value={outputLang} onChange={onOutputLangChange} options={OUT_LANGS} disabled={loading} t={t} />
      </div>

      {/* Action row */}
      <div className="action-row">
         {/* Multi-output toggle */}
         {onMultiOutputToggle && (
           <button
             id="multi-output-toggle"
             onClick={onMultiOutputToggle}
             aria-pressed={multiOutputEnabled}
             aria-label={multiOutputEnabled ? (t.disableMultiOutput || 'Disable multi-output') : (t.enableMultiOutput || 'Enable multi-output')}
             className="multi-output-btn touch-target"
             title={t.multiOutputTooltip || 'Generate multiple output variants'}
           >
             <span className="multi-output-icon">{multiOutputEnabled ? '×' : '+'}</span>
             <span className="multi-output-label">
               {t.multi || 'Multi'}
             </span>
           </button>
         )}

         {/* Enhance button */}
         <button
           id="enhance-btn"
           onClick={onEnhance}
           disabled={!canEnhance || loading}
           aria-label={t.enhance}
           className="enhance-btn touch-target"
         >
           {loading ? <LoadSpinner /> : <SparklesIcon className="enhance-icon" />}
           {loading ? t.enhancing : t.enhance}
         </button>

        {/* Inline model selector */}
        <ModelPill models={models} selectedModel={selectedModel} onModelChange={onModelChange} loading={loading} t={t} />

         {/* Regenerate button */}
         {showRegen && !loading && (
           <button
             id="regen-btn"
             onClick={onRegenerate}
             title={t.regenerateWithVariation}
             aria-label={t.regen}
             className="regen-btn touch-target"
           >
             <RegenerateIcon className="regen-icon" />
             <span>{t.regen}</span>
           </button>
         )}
      </div>
    </div>
  )
}