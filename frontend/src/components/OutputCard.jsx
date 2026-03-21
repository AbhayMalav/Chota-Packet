import React, { useRef, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import FeedbackBar from './FeedbackBar'
import { copyToClipboard } from '../services/clipboard'

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconSparkles = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.937A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
  </svg>
)

const IconClipboard = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </svg>
)

const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconSend = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
)

const IconChevronDown = ({ open }) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

const IconTrash = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
)

// ─── AI destinations ──────────────────────────────────────────────────────────

const AI_SITES = [
  { id: 'chatgpt',    name: 'ChatGPT',  url: 'https://chatgpt.com/',                  favicon: 'https://chatgpt.com/favicon.ico',                                          color: '#10a37f' },
  { id: 'gemini',     name: 'Gemini',   url: 'https://gemini.google.com/app',          favicon: 'https://www.google.com/s2/favicons?domain=gemini.google.com&sz=32',        color: '#4285f4' },
  { id: 'claude',     name: 'Claude',   url: 'https://claude.ai/new',                  favicon: 'https://claude.ai/favicon.ico',                                            color: '#d97757' },
  { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/',           favicon: 'https://www.perplexity.ai/favicon.ico',                                    color: '#20b2aa' },
  { id: 'grok',       name: 'Grok',     url: 'https://grok.x.ai/',                     favicon: 'https://grok.x.ai/favicon.ico',                                            color: '#e7e9ea' },
  { id: 'copilot',    name: 'Copilot',  url: 'https://copilot.microsoft.com/',         favicon: 'https://copilot.microsoft.com/favicon.ico',                                color: '#0078d4' },
  { id: 'deepseek',   name: 'DeepSeek', url: 'https://chat.deepseek.com/',             favicon: 'https://chat.deepseek.com/favicon.ico',                                    color: '#4d6bfe' },
  { id: 'mistral',    name: 'Le Chat',  url: 'https://chat.mistral.ai/chat',           favicon: 'https://chat.mistral.ai/favicon.ico',                                      color: '#ff7000' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function OutputCard({ text = '', onTextChange, onCompare: _onCompare, onClear }) {
  const cardRef         = useRef(null)
  const copyTimerRef    = useRef(null)
  const takeToRef       = useRef(null)
  const takeToButtonRef = useRef(null)
  const isFocusedRef    = useRef(false)

  const [copied,      setCopied]      = useState(false)
  const [takeToOpen,  setTakeToOpen]  = useState(false)
  const [takenTo,     setTakenTo]     = useState(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })

  const trimmedText = text.trim()
  const wordCount   = trimmedText ? trimmedText.split(/\s+/).length : 0

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
        takeToRef.current       && !takeToRef.current.contains(e.target) &&
        takeToButtonRef.current && !takeToButtonRef.current.contains(e.target)
      ) setTakeToOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [takeToOpen])

  const handleInput = useCallback(() => {
    onTextChange?.(cardRef.current?.innerText ?? '')
  }, [onTextChange])

  const handleFocus = useCallback(() => { isFocusedRef.current = true  }, [])
  const handleBlur  = useCallback(() => { isFocusedRef.current = false }, [])

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
        top:   rect.bottom + window.scrollY + 8,
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
            <IconSparkles /> Enhanced Prompt
          </span>

          <div className="flex items-center gap-1.5">
            {/* Copy */}
            <button
              onClick={handleCopy}
              aria-label={copied ? 'Copied!' : 'Copy enhanced prompt'}
              aria-live="polite"
              className={`flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full
                          font-semibold border transition-all duration-200 ${
                copied
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35'
                  : 'bg-purple-500/12 text-purple-300 border-purple-500/30 hover:bg-purple-500/20 hover:text-white hover:border-purple-400/50'
              }`}
            >
              {copied ? <IconCheck /> : <IconClipboard />}
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
                            disabled:opacity-30 disabled:cursor-not-allowed ${
                  takenTo
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35'
                    : takeToOpen
                      ? 'bg-purple-500/20 text-white border-purple-400/50'
                      : 'bg-purple-500/12 text-purple-300 border-purple-500/30 hover:bg-purple-500/20 hover:text-white hover:border-purple-400/50'
                }`}
              >
                {takenTo ? <IconCheck /> : <IconSend />}
                {takenTo ? 'Opening!' : 'Take it to'}
                {!takenTo && <IconChevronDown open={takeToOpen} />}
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
          className="min-h-[120px] px-4 py-4 text-sm leading-relaxed
                     whitespace-pre-wrap break-words focus:outline-none
                     transition-all duration-200"
          style={{ color: 'var(--theme-text)' }}
        />

        {/* ── Footer — single border-t row inside the card ─────────────── */}
        <div
          className="flex items-center justify-between px-4 py-2 border-t border-purple-500/10"
          style={{ minHeight: '38px' }}
        >
          {/* Left — stats */}
          <span
            className="text-[11px] font-medium tabular-nums flex-shrink-0"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            {text.length} chars · {wordCount} words
          </span>

          {/* Center — feedback */}
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] hidden sm:block"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
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
                className="flex items-center gap-1 text-[11px] font-medium px-2 py-1
                           rounded-lg hover:bg-red-500/10 hover:text-red-400
                           transition-all duration-200"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                <IconTrash /> Clear
              </button>
            ) : (
              // Reserve space so center stays centered when clear is hidden
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
            top:      dropdownPos.top,
            right:    dropdownPos.right,
            zIndex:   9999,
          }}
          className="w-52 glass-card rounded-2xl shadow-xl animate-fade-in border border-purple-500/15 overflow-hidden"
        >
          <p
            className="px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider
                       border-b border-purple-500/10"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            Copies prompt · opens new chat
          </p>
          <div className="max-h-64 overflow-y-auto overflow-x-hidden py-1">
            {AI_SITES.map(site => (
              <button
                key={site.id}
                onClick={() => handleTakeTo(site)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium
                           hover:bg-purple-500/10 transition-colors duration-150"
                style={{ color: 'var(--theme-text)' }}
              >
                <span className="relative w-4 h-4 flex-shrink-0">
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
