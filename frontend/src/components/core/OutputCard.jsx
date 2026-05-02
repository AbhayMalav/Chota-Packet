import React, { useRef, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import FeedbackBar from '../ui/FeedbackBar'
import { copyToClipboard } from '../../services/clipboard'
import { SparklesIcon, ChevronDownIcon, ClipboardIcon, CheckIcon, SendIcon, TrashIcon, ClaudeIcon, PerplexityIcon, GrokIcon, DeepSeekIcon, MistralIcon, SarvamIcon, AIFiestaIcon, XIcon, RegenerateIcon } from '../ui/icons'
import { translations } from '../../config/translations'
import { useTheme } from '../../context/ThemeContext'
import { STYLES, TONES, LEVELS, OUT_LANGS } from '../../config/constants'
import './OutputCard.css'


// ─── AI destinations ──────────────────────────────────────────────────────────


const AI_SITES = [
  { id: 'sarvam', name: 'Sarvam AI', url: 'https://indus.sarvam.ai/', icon: SarvamIcon, color: '#ff6c02' },
  { id: 'aifiesta', name: 'AI Fiesta', url: 'https://aifiesta.ai/', icon: AIFiestaIcon, color: '#39D47A' },
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/', favicon: 'https://chatgpt.com/favicon.ico', color: '#10a37f' },
  { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app', favicon: 'https://www.google.com/s2/favicons?domain=gemini.google.com&sz=32', color: '#4285f4' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai/new', icon: ClaudeIcon, color: '#d97757' },
  { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/', icon: PerplexityIcon, color: '#20b2aa' },
  { id: 'grok', name: 'Grok', url: 'https://grok.x.ai/', icon: GrokIcon, color: '#e7e9ea' },
  { id: 'copilot', name: 'Copilot', url: 'https://copilot.microsoft.com/', favicon: 'https://copilot.microsoft.com/favicon.ico', color: '#0078d4' },
  { id: 'deepseek', name: 'DeepSeek', url: 'https://chat.deepseek.com/', icon: DeepSeekIcon, color: '#4d6bfe' },
  { id: 'mistral', name: 'Mistral', url: 'https://chat.mistral.ai/chat', icon: MistralIcon, color: '#ff7000' },
]


// ─── Component ────────────────────────────────────────────────────────────────


export default function OutputCard({ 
  text = '', 
  onTextChange, 
  onClear,
  config = {},
  onConfigChange,
  models = [],
  selectedModel,
  onModelChange,
  showControls = false,
  index = 0,
  onRemove,
  onRegenerate,
  isLoading = false,
  isError = false
}) {
  const { language } = useTheme()
  const t = translations[language] || translations.en

  const cardRef = useRef(null)
  const copyTimerRef = useRef(null)
  const takeToWrapperRef = useRef(null)
  const takeToDropdownRef = useRef(null)
  const takeToButtonRef = useRef(null)
  const takeToTimeoutRef = useRef(null)
  const isFocusedRef = useRef(false)

  const [copied, setCopied] = useState(false)
  const [takeToOpen, setTakeToOpen] = useState(false)
  const [takenTo, setTakenTo] = useState(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })

  const { tone = '', level = 'basic', style = 'general', outputLang = 'auto' } = config

  const trimmedText = text.trim()
  const wordCount = trimmedText ? trimmedText.split(/\s+/).length : 0


  // ── Sync external text → contenteditable ─────────────────────────────────
  useEffect(() => {
    const el = cardRef.current
    if (!el || isFocusedRef.current) return
    if (el.innerText !== text) el.innerText = text
  }, [text])


  // ── Cleanup copy timer on unmount ─────────────────────────────────────────
  useEffect(() => () => clearTimeout(copyTimerRef.current), [])

  // ── Cleanup takeTo timeout on unmount ──────────────────────��──────────────
  useEffect(() => () => clearTimeout(takeToTimeoutRef.current), [])

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    if (!takeToOpen) return
    const handler = (e) => {
      if (
        !takeToWrapperRef.current?.contains(e.target) &&
        !takeToDropdownRef.current?.contains(e.target)
      ) setTakeToOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [takeToOpen])


  const handleInput = useCallback(() => { onTextChange?.(cardRef.current?.innerText ?? '') }, [onTextChange])
  const handleFocus = useCallback(() => { isFocusedRef.current = true }, [])
  const handleBlur = useCallback(() => { isFocusedRef.current = false }, [])

  const flashCopied = useCallback(() => {
    setCopied(true)
    clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
  }, [])

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(cardRef.current?.innerText ?? '')
    if (ok) flashCopied()
    else console.warn('[OutputCard] Copy failed — clipboard utility returned false.')
  }, [flashCopied])

  const handleTakeToToggle = useCallback(() => {
    if (!trimmedText) return
    if (!takeToOpen && takeToButtonRef.current) {
      const rect = takeToButtonRef.current.getBoundingClientRect()
      setDropdownPos({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right,
      })
    }
    setTakeToOpen(o => !o)
  }, [takeToOpen, trimmedText])

  const handleTakeTo = useCallback(async (site) => {
    setTakeToOpen(false)
    const ok = await copyToClipboard(cardRef.current?.innerText ?? '')
    if (ok) flashCopied()
    setTakenTo(site.id)
    clearTimeout(takeToTimeoutRef.current)
    takeToTimeoutRef.current = setTimeout(() => setTakenTo(null), 2500)
    window.open(site.url, '_blank', 'noopener,noreferrer')
  }, [flashCopied])


  return (
    <div className="flex flex-col gap-3 animate-fade-in relative">
      {/* Loading overlay */}
      {isLoading && (
        <div className="output-card__loading-overlay">
          <div className="flex flex-col items-center gap-2">
            <svg className="animate-spin h-6 w-6 output-card__loading-spinner" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-2a8 8 0 01-8-8z" />
            </svg>
            <span className="text-xs font-medium output-card__loading-text">{t.enhancing || 'Enhancing...'}</span>
          </div>
        </div>
      )}

      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <div className={`glass-card rounded-xl shimmer-border-top ${isLoading ? 'output-card--loading' : ''}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 output-card__header">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest gradient-text flex items-center gap-1.5">
              <SparklesIcon className="w-3 h-3" /> {t.enhancedPrompt}
            </span>
            {showControls && (
              <span className="text-[10px] px-2 py-0.5 rounded-lg output-card__header-badge">
                #{index + 1}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Copy */}
            <button
              onClick={handleCopy}
              aria-label={copied ? t.copied : t.copy}
              aria-live="polite"
              className={`output-card__btn ${copied
                  ? 'output-card__btn--copied'
                  : 'output-card__btn--default'
                }`}
            >
              {copied ? <CheckIcon className="w-3 h-3" /> : <ClipboardIcon className="w-3 h-3" />}
              {copied ? t.copied : t.copy}
            </button>

            {/* Take it to */}
            <div className="relative" ref={takeToWrapperRef}>
              <button
                ref={takeToButtonRef}
                onClick={handleTakeToToggle}
                disabled={!trimmedText}
                aria-haspopup="true"
                aria-expanded={takeToOpen}
                aria-label={t.takeItTo}
                className={`output-card__btn ${takenTo
                    ? 'output-card__btn--copied'
                    : takeToOpen
                      ? 'output-card__btn--active'
                      : 'output-card__btn--default'
                  } ${!trimmedText ? 'output-card__btn--disabled' : ''}`}
              >
                {takenTo ? <CheckIcon className="w-3 h-3" /> : <SendIcon className="w-3 h-3" />}
                {takenTo ? t.opening : t.takeItTo}
                {!takenTo && (
                  <ChevronDownIcon
                    className={`w-2.5 h-2.5 transition-transform duration-200 ${takeToOpen ? 'rotate-180' : ''}`}
                  />
                )}
              </button>
            </div>

            {/* Regenerate - only in multi-output mode */}
            {showControls && onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={isLoading}
                aria-label={t.regenerateWithVariation || 'Regenerate'}
                className={`output-card__btn output-card__btn--default ${isLoading ? 'output-card__btn--disabled' : ''}`}
              >
                <RegenerateIcon className="w-3 h-3" />
                {t.regen || 'Regen'}
              </button>
            )}
          </div>
        </div>

        {/* Error state */}
        {isError && (
          <div className="px-4 py-8 text-center">
            <XIcon className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--color-danger)' }} />
            <p className="text-sm" style={{ color: 'var(--color-danger-muted)' }}>{t.error || 'Error'}</p>
            <p className="text-muted text-xs mt-1">Failed to generate this output</p>
            <button
              onClick={onRegenerate}
              className="mt-3 btn-secondary text-xs py-1.5 px-3"
            >
              <RegenerateIcon className="w-3 h-3 inline mr-1" />
              Retry
            </button>
          </div>
        )}

        {/* Editable output area */}
        {!isError && (
        <div
          ref={cardRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          data-placeholder={t.yourEnhancedPrompt}
          aria-label={t.enhancedPrompt}
          aria-multiline="true"
          role="textbox"
className="text-theme min-h-[120px] px-4 py-4 text-sm leading-relaxed
                      whitespace-pre-wrap break-words focus:outline-none
                      transition-all duration-200"
        />
        )}

        {/* Per-card controls - shown when showControls is true */}
        {showControls && (
          <div className="px-4 py-3 output-card__controls">
            <div className="flex flex-wrap items-center gap-2">
              {/* Model selector */}
              {models.length > 0 && (
                <select
                  value={selectedModel || ''}
                  onChange={(e) => onModelChange?.(e.target.value)}
                  aria-label="Model selector"
                  className="output-card__select"
                >
                  <option value="">Auto</option>
                  {models.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              )}

              {/* Style */}
              <select
                value={style}
                onChange={(e) => onConfigChange?.({ ...config, style: e.target.value })}
                aria-label="Style"
                className="output-card__select"
              >
                {STYLES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>

              {/* Tone */}
              <select
                value={tone}
                onChange={(e) => onConfigChange?.({ ...config, tone: e.target.value })}
                aria-label="Tone"
                className="output-card__select"
              >
                {TONES.map(toneOpt => (
                  <option key={toneOpt.value} value={toneOpt.value}>{toneOpt.label}</option>
                ))}
              </select>

              {/* Level */}
              <select
                value={level}
                onChange={(e) => onConfigChange?.({ ...config, level: e.target.value })}
                aria-label="Level"
                className="output-card__select"
              >
                {LEVELS.filter(l => !['chain_of_thought', 'meta', 'prompt_chaining', 'multi_prompt_fusion', 'soft_prompting'].includes(l.value)).map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>

              {/* Output Language */}
              <select
                value={outputLang}
                onChange={(e) => onConfigChange?.({ ...config, outputLang: e.target.value })}
                aria-label="Output language"
                className="output-card__select"
              >
                {OUT_LANGS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>

              {/* Remove button */}
              {onRemove && (
                <button
                  onClick={onRemove}
                  aria-label="Remove variant"
                  className="ml-auto text-secondary output-card__btn--danger p-1.5 rounded-lg transition-all"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className="output-card__footer flex items-center justify-between px-4 py-2">

          {/* Left — stats */}
          <span className="text-secondary text-[11px] font-medium tabular-nums flex-shrink-0">
            {text.length} {t.charsWords.replace(' · ', ' ').split(' ')[0]} {wordCount} {t.charsWords.replace(' · ', ' ').split(' ')[2] || ''}
          </span>

          {/* Center — feedback */}
          <div className="flex items-center gap-2">
            <span className="text-secondary text-[11px] hidden sm:block">
              {t.helpful}
            </span>
            <FeedbackBar />
          </div>

          {/* Right — clear */}
          <div className="flex-shrink-0">
            {onClear && text.length > 0 ? (
              <button
                onClick={onClear}
                aria-label={t.clearOutput}
                className="text-secondary flex items-center gap-1 text-[11px] font-medium px-2 py-1
                           rounded-lg output-card__btn--danger
                           transition-all duration-200"
              >
                <TrashIcon className="w-3 h-3" /> {t.clear}
              </button>
            ) : (
              <div className="w-[52px]" />
            )}
          </div>
        </div>

      </div>

      {/* ── Take it to dropdown — portalled to <body> ────────────────────── */}
      {takeToOpen && createPortal(
        <div
          ref={takeToDropdownRef}
          style={{
            position: 'absolute',
            top: dropdownPos.top,
            right: dropdownPos.right,
            zIndex: 9999,
          }}
          className="w-52 glass-card rounded-2xl shadow-xl animate-fade-in output-card__dropdown overflow-hidden"
        >
          <p className="text-secondary px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider output-card__dropdown-header">
            {t.copiesPromptOpensNewChat}
          </p>
          <div className="max-h-64 overflow-y-auto overflow-x-hidden py-1">
            {AI_SITES.map(site => (
              <button
                key={site.id}
                onClick={() => handleTakeTo(site)}
                className="text-theme w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium output-card__dropdown-item transition-colors duration-150"
              >
                <span className="relative w-4 h-4 flex-shrink-0 flex items-center justify-center">
                  {site.icon ? (
                    <site.icon className="w-4 h-4" style={{ color: site.color }} />
                  ) : (
                    <>
                      <img
                        src={site.favicon}
                        alt=""
                        width={16}
                        height={16}
                        className="rounded-sm w-4 h-4 object-contain"
                        onError={e => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling.style.display = 'flex'
                        }}
                      />
                      <span
                        className="absolute inset-0 rounded-sm text-[9px] font-bold
                                   items-center justify-center text-white hidden"
                        style={{ background: site.color }}
                      >
                        {site.name[0]}
                      </span>
                    </>
                  )}
                </span>
                <span className="flex-1 text-left">{site.name}</span>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}

    </div>
  )
}