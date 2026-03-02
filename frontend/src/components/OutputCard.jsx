import React, { useRef, useState, useEffect, useCallback } from 'react'
import TokenCounter from './TokenCounter'
import FeedbackBar from './FeedbackBar'

export default function OutputCard({ text, onTextChange, onCompare }) {
  const cardRef = useRef(null)
  const [copied, setCopied] = useState(false)

  // Sync external text → contenteditable
  useEffect(() => {
    const el = cardRef.current
    if (el && el.innerText !== text) el.innerText = text
  }, [text])

  const handleInput = useCallback(() => {
    onTextChange?.(cardRef.current?.innerText || '')
  }, [onTextChange])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cardRef.current?.innerText || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      document.execCommand('copy')
    }
  }, [])

  return (
    <div className="flex flex-col gap-2 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Enhanced Prompt
        </span>
        <div className="flex items-center gap-1.5">
          {onCompare && (
            <button
              onClick={onCompare}
              title="View diff"
              aria-label="Compare with original"
              className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600
                         text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              Compare
            </button>
          )}
          <button
            id="copy-btn"
            onClick={handleCopy}
            aria-label="Copy enhanced prompt"
            className={`flex items-center gap-1 text-xs px-3 py-1 rounded-lg font-medium transition
                        ${copied
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          >
            {copied ? '✓ Copied!' : '⎘ Copy'}
          </button>
        </div>
      </div>

      {/* Editable output */}
      <div
        ref={cardRef}
        id="output-card"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder="Your enhanced prompt will appear here…"
        aria-label="Enhanced prompt output (editable)"
        aria-multiline="true"
        role="textbox"
        className="min-h-[120px] rounded-xl border border-violet-200 dark:border-violet-800/50
                   bg-violet-50/40 dark:bg-violet-950/20 text-gray-900 dark:text-gray-100
                   px-4 py-3 text-sm leading-relaxed focus:ring-2 focus:ring-violet-500
                   whitespace-pre-wrap break-words shadow-sm"
      />

      {/* Token counter + feedback */}
      <div className="flex items-center justify-between px-1">
        <TokenCounter text={text} />
        <FeedbackBar />
      </div>
    </div>
  )
}
