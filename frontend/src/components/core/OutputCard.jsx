import React, { useRef, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import FeedbackBar from '../ui/FeedbackBar'
import { copyToClipboard } from '../../services/clipboard'
import { SparklesIcon, ChevronDownIcon, ClipboardIcon, CheckIcon, SendIcon, TrashIcon, ClaudeIcon, PerplexityIcon, GrokIcon, DeepSeekIcon, MistralIcon, SarvamIcon, AIFiestaIcon } from '../ui/icons'
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


export default function OutputCard({ text = '', onTextChange, onClear }) {
  const cardRef = useRef(null)
  const copyTimerRef = useRef(null)
  const takeToRef = useRef(null)
  const takeToButtonRef = useRef(null)
  const isFocusedRef = useRef(false)

  const [copied, setCopied] = useState(false)
  const [takeToOpen, setTakeToOpen] = useState(false)
  const [takenTo, setTakenTo] = useState(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })

  const trimmedText = text.trim()
  const wordCount = trimmedText ? trimmedText.split(/\s+/).length : 0


  // ── Sync external text → contenteditable ─────────────────────────────────
  useEffect(() => {
    const el = cardRef.current
    if (!el || isFocusedRef.current) return
    if (el.innerText !== text) el.innerText = text
  }, [text])


  // ── Cleanup copy timer on unmount ─────────────────────────────────────────
  useEffect(() => () => { clearTimeout(copyTimerRef.current) }, [])


  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    if (!takeToOpen) return
    const handler = (e) => {
      if (
        takeToRef.current && !takeToRef.current.contains(e.target) &&
        takeToButtonRef.current && !takeToButtonRef.current.contains(e.target)
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
    setTimeout(() => setTakenTo(null), 2500)
    window.open(site.url, '_blank', 'noopener,noreferrer')
  }, [flashCopied])


  return (
    <div className="flex flex-col gap-3 animate-fade-in">

      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <div className="glass-card rounded-xl shimmer-border-top">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-purple-500/10">
          <span className="text-[11px] font-bold uppercase tracking-widest gradient-text flex items-center gap-1.5">
            <SparklesIcon className="w-3 h-3" /> Enhanced Prompt
          </span>

          <div className="flex items-center gap-1.5">
            {/* Copy */}
            <button
              onClick={handleCopy}
              aria-label={copied ? 'Copied!' : 'Copy enhanced prompt'}
              aria-live="polite"
              className={`flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full
                          font-semibold border transition-all duration-200 ${copied
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35'
                  : 'bg-purple-500/12 text-purple-300 border-purple-500/30 hover:bg-purple-500/20 hover:text-white hover:border-purple-400/50'
                }`}
            >
              {copied ? <CheckIcon className="w-3 h-3" /> : <ClipboardIcon className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>

            {/* Take it to */}
            <div className="relative" ref={takeToRef}>
              <button
                ref={takeToButtonRef}
                onClick={handleTakeToToggle}
                disabled={!trimmedText}
                aria-haspopup="true"
                aria-expanded={takeToOpen}
                aria-label="Take prompt to an AI tool"
                className={`flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full
                            font-semibold border transition-all duration-200
                            disabled:opacity-30 disabled:cursor-not-allowed ${takenTo
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35'
                    : takeToOpen
                      ? 'bg-purple-500/20 text-white border-purple-400/50'
                      : 'bg-purple-500/12 text-purple-300 border-purple-500/30 hover:bg-purple-500/20 hover:text-white hover:border-purple-400/50'
                  }`}
              >
                {takenTo ? <CheckIcon className="w-3 h-3" /> : <SendIcon className="w-3 h-3" />}
                {takenTo ? 'Opening!' : 'Take it to'}
                {!takenTo && (
                  <ChevronDownIcon
                    className={`w-2.5 h-2.5 transition-transform duration-200 ${takeToOpen ? 'rotate-180' : ''}`}
                  />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Editable output area */}
        <div
          ref={cardRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          data-placeholder="Your enhanced prompt will appear here…"
          aria-label="Enhanced prompt output (editable)"
          aria-multiline="true"
          role="textbox"
          className="text-theme min-h-[120px] px-4 py-4 text-sm leading-relaxed
                     whitespace-pre-wrap break-words focus:outline-none
                     transition-all duration-200"
        />

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className="output-card__footer flex items-center justify-between px-4 py-2 border-t border-purple-500/10">

          {/* Left — stats */}
          <span className="text-secondary text-[11px] font-medium tabular-nums flex-shrink-0">
            {text.length} chars · {wordCount} words
          </span>

          {/* Center — feedback */}
          <div className="flex items-center gap-2">
            <span className="text-secondary text-[11px] hidden sm:block">
              Helpful?
            </span>
            <FeedbackBar />
          </div>

          {/* Right — clear */}
          <div className="flex-shrink-0">
            {onClear && text.length > 0 ? (
              <button
                onClick={onClear}
                aria-label="Clear output"
                className="text-secondary flex items-center gap-1 text-[11px] font-medium px-2 py-1
                           rounded-lg hover:bg-red-500/10 hover:text-red-400
                           transition-all duration-200"
              >
                <TrashIcon className="w-3 h-3" /> Clear
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
          ref={takeToRef}
          style={{
            position: 'absolute',
            top: dropdownPos.top,
            right: dropdownPos.right,
            zIndex: 9999,
          }}
          className="w-52 glass-card rounded-2xl shadow-xl animate-fade-in border border-purple-500/15 overflow-hidden"
        >
          <p className="text-secondary px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider border-b border-purple-500/10">
            Copies prompt · opens new chat
          </p>
          <div className="max-h-64 overflow-y-auto overflow-x-hidden py-1">
            {AI_SITES.map(site => (
              <button
                key={site.id}
                onClick={() => handleTakeTo(site)}
                className="text-theme w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium
                           hover:bg-purple-500/10 transition-colors duration-150"
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
