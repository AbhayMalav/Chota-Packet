import React, { useRef, useState, useEffect, useCallback } from 'react'
import { MAX_INPUT_CHARS } from '../constants'
import FeedbackBar from './FeedbackBar'

export default function OutputCard({ text = '', onTextChange, onCompare, onClear }) {
  const cardRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const copyBtnId = React.useId()
  const outputCardId = React.useId()
  
  const trimmedText = text.trim()
  const wordCount = trimmedText ? trimmedText.split(/\s+/).length : 0

  // Sync external text → contenteditable
  useEffect(() => {
    const el = cardRef.current
    if (el && el.innerText !== text) el.innerText = text
  }, [text])

  const handleInput = useCallback(() => {
    onTextChange?.(cardRef.current?.innerText || '')
  }, [onTextChange])

  const handleCopy = useCallback(async () => {
    const textToCopy = cardRef.current?.innerText || ''
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: create temporary textarea, select, and copy
      const textarea = document.createElement('textarea')
      textarea.value = textToCopy
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (fallbackErr) {
        console.error('Copy failed:', fallbackErr)
      } finally {
        document.body.removeChild(textarea)
      }
    }
  }, [])

  return (
    <div className="flex flex-col gap-3 animate-fade-in">
      {/* Card with shimmering neon top border */}
      <div className="rounded-xl border border-purple-500/20 bg-black/25 shimmer-border-top overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-purple-500/10">
          <span className="text-[11px] font-bold uppercase tracking-widest gradient-text flex items-center gap-1.5">
            <span>✨</span> Enhanced Prompt
          </span>
          <div className="flex items-center gap-1.5">
            {onCompare && (
              <button
                onClick={onCompare}
                title="Compare with original"
                aria-label="Compare diff"
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full
                           border border-purple-500/20 text-purple-400 font-medium
                           hover:bg-purple-500/10 hover:border-purple-500/40
                           transition-all duration-200"
              >
                <span>🆚</span> Diff
              </button>
            )}
            <button
              id={copyBtnId}
              onClick={handleCopy}
              aria-label="Copy enhanced prompt"
              className={`flex items-center gap-1 text-[11px] px-3 py-1 rounded-full font-semibold
                          transition-all duration-200
                          ${copied
                            ? 'gradient-brand text-white shadow-sm shadow-purple-500/25'
                            : 'border border-purple-500/20 text-gray-400 hover:text-purple-400 hover:border-purple-500/40 hover:bg-purple-500/10'}`}
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
        </div>

        {/* Editable content area */}
        <div
          ref={cardRef}
          id={outputCardId}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          data-placeholder="Your enhanced prompt will appear here…"
          aria-label="Enhanced prompt output (editable)"
          aria-multiline="true"
          role="textbox"
          className="min-h-[120px] px-4 py-4 text-sm leading-relaxed text-[var(--theme-text)]
                     whitespace-pre-wrap break-words focus:outline-none
                     transition-all duration-200"
        />
      </div>

      {/* Counter + feedback */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] text-gray-600 font-medium tabular-nums">
          {text.length}/{MAX_INPUT_CHARS} chars · {wordCount} words
        </span>
        
        <div className="flex items-center gap-2">
          {onClear && text.length > 0 && (
            <button
              onClick={onClear}
              className="text-[11px] font-bold text-gray-400 hover:text-red-400 px-2 py-1 transition-colors"
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
