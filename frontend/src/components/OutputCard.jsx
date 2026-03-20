import React, { useRef, useState, useEffect, useCallback } from 'react'
import FeedbackBar from './FeedbackBar'

export default function OutputCard({ text = '', onTextChange, onCompare, onClear }) {
  const cardRef        = useRef(null)
  const copyTimerRef   = useRef(null)
  const isFocusedRef   = useRef(false)
  const [copied, setCopied] = useState(false)

  const trimmedText = text.trim()
  const wordCount   = trimmedText ? trimmedText.split(/\s+/).length : 0

  // ── Sync external text → contenteditable ───────────────────────────────────
  // Only update innerText when the card is NOT focused — prevents resetting
  // the cursor while the user is actively editing.
  useEffect(() => {
    const el = cardRef.current
    if (!el || isFocusedRef.current) return
    if (el.innerText !== text) el.innerText = text
  }, [text])

  // ── Clear copy timer on unmount ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  const handleInput = useCallback(() => {
    onTextChange?.(cardRef.current?.innerText ?? '')
  }, [onTextChange])

  const handleFocus = useCallback(() => { isFocusedRef.current = true  }, [])
  const handleBlur  = useCallback(() => { isFocusedRef.current = false }, [])

  // ── Copy handler ───────────────────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    const textToCopy = cardRef.current?.innerText ?? ''

    const confirmCopied = () => {
      setCopied(true)
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
    }

    try {
      await navigator.clipboard.writeText(textToCopy)
      confirmCopied()
    } catch {
      // Fallback: deprecated execCommand — retained for environments without
      // Clipboard API (e.g. non-HTTPS, older WebViews). Remove when no longer needed.
      const textarea = document.createElement('textarea')
      textarea.value          = textToCopy
      textarea.style.position = 'fixed'
      textarea.style.opacity  = '0'
      document.body.appendChild(textarea)
      try {
        textarea.select()
        document.execCommand('copy') // eslint-disable-line no-restricted-globals
        confirmCopied()
      } catch (fallbackErr) {
        console.error('[OutputCard] Copy failed:', fallbackErr)
      } finally {
        // Guaranteed cleanup — runs even if component unmounts mid-copy
        document.body.removeChild(textarea)
      }
    }
  }, [])

  return (
    <div className="flex flex-col gap-3 animate-fade-in">
      {/* Card with shimmering neon top border */}
      <div className="rounded-xl border border-purple-500/20 shimmer-border-top overflow-hidden"
           style={{ background: 'rgba(0,0,0,0.25)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-purple-500/10">
          <span className="text-[11px] font-bold uppercase tracking-widest gradient-text flex items-center gap-1.5">
            <span aria-hidden="true">✨</span> Enhanced Prompt
          </span>

          <div className="flex items-center gap-1.5">
            {onCompare && (
              <button
                onClick={onCompare}
                title="Compare with original"
                aria-label="Compare with original (diff view)"
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full
                           border border-purple-500/20 text-purple-400 font-medium
                           hover:bg-purple-500/10 hover:border-purple-500/40
                           transition-all duration-200"
              >
                <span aria-hidden="true">🆚</span> Diff
              </button>
            )}

            <button
              onClick={handleCopy}
              aria-label={copied ? 'Copied!' : 'Copy enhanced prompt'}
              aria-live="polite"
              className={`flex items-center gap-1 text-[11px] px-3 py-1 rounded-full font-semibold
                          transition-all duration-200 ${
                            copied
                              ? 'gradient-brand text-white shadow-sm shadow-purple-500/25'
                              : 'border border-purple-500/20 text-gray-400 hover:text-purple-400 hover:border-purple-500/40 hover:bg-purple-500/10'
                          }`}
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
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
      </div>

      {/* Counter + feedback row */}
      <div className="flex items-center justify-between px-1">
        {/* Output-appropriate counter — no input limit denominator */}
        <span
          className="text-[11px] font-medium tabular-nums"
          style={{ color: 'var(--theme-text-secondary)' }}
        >
          {text.length} chars · {wordCount} words
        </span>

        <div className="flex items-center gap-2">
          {onClear && text.length > 0 && (
            <button
              onClick={onClear}
              className="text-[11px] font-bold hover:text-red-400 px-2 py-1 transition-colors"
              style={{ color: 'var(--theme-text-secondary)' }}
              aria-label="Clear output"
            >
              CLEAR
            </button>
          )}
          <FeedbackBar />
        </div>
      </div>
    </div>
  )
}
