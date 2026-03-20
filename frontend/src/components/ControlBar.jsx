import React, { useState, useRef, useEffect, useCallback } from 'react'
import { STYLES, TONES, LEVELS, OUT_LANGS } from '../constants'

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
function PillSelect({ id, label, value, onChange, options, disabled }) {
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const dropdownRef = useRef(null)
  const optionRefs = useRef([])

  const selectedIndex = options.findIndex((o) => o.value === value)
  const selectedLabel = options[selectedIndex]?.label || ''

  // Reset focused index to current selection when opening
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

  // Close on outside click
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

  // Focus the highlighted option in the DOM when index changes
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
    <div className="flex flex-col gap-1 flex-1 min-w-[100px] relative" ref={dropdownRef}>
      <label
        htmlFor={id}
        className="text-[10px] font-bold uppercase tracking-widest"
        style={{ color: 'var(--theme-text-muted)' }}
      >
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
        className={[
          'flex items-center justify-between rounded-full border text-xs px-3 py-2 min-h-[44px] md:min-h-auto',
          'focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/30',
          'disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all duration-200',
          'hover:border-purple-500/30',
          open
            ? 'border-purple-500/40 ring-1 ring-purple-500/30'
            : 'border-purple-500/15',
        ].join(' ')}
        style={{
          background: open ? 'var(--theme-input-bg-focus)' : 'var(--theme-input-bg)',
          color: 'var(--theme-text)',
        }}
      >
        <span className="truncate pr-2">{selectedLabel}</span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-3 h-3 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="absolute left-0 top-full mt-1.5 w-full min-w-[130px] rounded-2xl glass-card shadow-xl py-1.5 z-50 animate-fade-in max-h-60 overflow-y-auto overflow-x-hidden"
        >
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
              className={[
                'w-full text-left px-3 py-2 text-xs transition-all duration-150',
                o.value === value
                  ? 'bg-purple-500/15 text-purple-400 font-medium'
                  : 'hover:bg-purple-500/10 hover:text-purple-400',
              ].join(' ')}
              style={{ color: o.value === value ? undefined : 'var(--theme-text)' }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── ModelPill ─────────────────────────────────────────────────────────────────
function ModelPill({ models, selectedModel, onModelChange, loading }) {
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const dropdownRef = useRef(null)
  const optionRefs = useRef([])

  const isEmpty = !models || models.length === 0
  const selectedLabel = models?.find((m) => m.id === selectedModel)?.name || 'Model'
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
    <div className="relative flex-shrink-0" ref={dropdownRef}>
      <button
        type="button"
        id="model-pill-btn"
        onClick={() => (open ? closeDropdown() : openDropdown())}
        onKeyDown={handleTriggerKeyDown}
        disabled={loading || isEmpty}
        title={isEmpty ? 'No models available - add an API key in Settings' : selectedLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="model-pill-listbox"
        className={[
          'flex items-center gap-1.5 px-3 py-2 min-h-[44px] md:min-h-auto rounded-full border text-xs font-medium whitespace-nowrap',
          'focus:outline-none focus-ring transition-all duration-200',
          isEmpty || loading
            ? 'border-purple-500/10 text-gray-600 opacity-40 cursor-not-allowed'
            : 'border-purple-500/20 text-purple-300 hover:border-purple-500/40 hover:bg-purple-500/8 hover:text-purple-200',
          open ? 'border-purple-500/40 ring-1 ring-purple-500/25' : '',
        ].join(' ')}
        style={{ background: 'var(--theme-input-bg)' }}
      >
        {/* chip icon */}
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 flex-shrink-0 opacity-70" aria-hidden="true">
          <path d="M13 7H7v6h6V7z" />
          <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
        </svg>

        <span className="truncate max-w-[120px]">{isEmpty ? 'No models' : truncated}</span>

        {!isEmpty && !loading && (
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-3 h-3 text-gray-500 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {open && Array.isArray(models) && (
        <div
          id="model-pill-listbox"
          role="listbox"
          aria-label="Select model"
          className="absolute right-0 top-full mt-1.5 w-64 rounded-2xl glass-card shadow-xl py-1.5 z-50 animate-fade-in max-h-56 overflow-y-auto overflow-x-hidden"
        >
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
              className={[
                'w-full text-left px-3 py-2.5 transition-all duration-150',
                m.id === selectedModel
                  ? 'bg-purple-500/15 text-purple-400'
                  : 'hover:bg-purple-500/10 hover:text-purple-400',
              ].join(' ')}
              style={{ color: m.id === selectedModel ? undefined : 'var(--theme-text)' }}
            >
              <p className={`text-xs font-medium truncate ${m.id === selectedModel ? 'text-purple-400' : ''}`}>
                {m.name}
              </p>
              {m.context_length && (
                <p className="text-[10px] text-gray-600 mt-0.5">
                  {m.context_length.toLocaleString()} ctx
                  {m.cost_per_1k_tokens === 0 && ' · free'}
                </p>
              )}
            </button>
          ))}
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
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Pill dropdowns row */}
      <div className="flex flex-wrap gap-2.5">
        <PillSelect id="style-select" label="Style" value={style} onChange={onStyleChange} options={STYLES} disabled={loading} />
        <PillSelect id="tone-select" label="Tone" value={tone} onChange={onToneChange} options={TONES} disabled={loading} />
        <PillSelect id="level-select" label="Level" value={level} onChange={onLevelChange} options={LEVELS} disabled={loading} />
        <PillSelect id="outlang-select" label="Output" value={outputLang} onChange={onOutputLangChange} options={OUT_LANGS} disabled={loading} />
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Enhance button */}
        <button
          id="enhance-btn"
          onClick={onEnhance}
          disabled={!canEnhance || loading}
          aria-label="Enhance prompt"
          className={[
            'flex-1 flex items-center justify-center gap-2 py-3 min-h-[44px] rounded-full',
            'gradient-brand text-white font-semibold text-sm tracking-wide',
            'shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:brightness-110',
            'active:brightness-90 active:scale-[0.98]',
            'disabled:opacity-25 disabled:cursor-not-allowed disabled:shadow-none',
            'transition-all duration-200',
          ].join(' ')}
        >
          {loading ? <LoadSpinner /> : <span aria-hidden="true">✦</span>}
          {loading ? 'Enhancing…' : 'Enhance'}
        </button>

        {/* Inline model selector */}
        <ModelPill models={models} selectedModel={selectedModel} onModelChange={onModelChange} loading={loading} />

        {/* Regenerate button */}
        {showRegen && !loading && (
          <button
            id="regen-btn"
            onClick={onRegenerate}
            title="Regenerate with variation"
            aria-label="Regenerate"
            className={[
              'flex items-center gap-1.5 px-4 py-3 min-h-[44px] rounded-full border border-purple-500/25',
              'text-purple-400 text-sm font-medium',
              'hover:bg-purple-500/10 hover:border-purple-500/40 transition-all duration-200 whitespace-nowrap',
            ].join(' ')}
          >
            <span>↺</span>
            <span>Regen</span>
          </button>
        )}
      </div>
    </div>
  )
}
