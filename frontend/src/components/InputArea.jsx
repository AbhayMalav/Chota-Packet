import React, { useRef, useEffect } from 'react'
import { MAX_INPUT_CHARS, LANGS } from '../constants'

export default function InputArea({ value, onChange, inputLang, onLangChange, onClear, children }) {
  const textareaRef = useRef(null)
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 280) + 'px'
  }, [value])

  return (
    <div className="flex flex-col gap-2">
      {/* Label row */}
      <div className="flex items-center justify-between px-0.5">
        <label htmlFor="prompt-input"
               className="text-[11px] font-bold uppercase tracking-widest text-purple-400/70">
          Input Prompt
        </label>
        {/* Language selector — SRS: EN and HI only */}
        <div className="flex items-center gap-0.5 rounded-lg overflow-hidden border border-purple-500/20 bg-purple-500/5">
          {LANGS.map((lang) => (
            <button
              type="button"
              key={lang.value}
              onClick={() => onLangChange(lang.value)}
              aria-pressed={inputLang === lang.value}
              className={`px-2 py-0.5 text-[10px] min-h-[44px] md:min-h-[auto] font-bold tracking-wider transition-all duration-200
                ${inputLang === lang.value
                  ? 'gradient-brand text-white'
                  : 'text-gray-500 hover:text-purple-400 hover:bg-purple-500/10'}`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          id="prompt-input"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_INPUT_CHARS))}
          placeholder="Type or paste your prompt here…"
          rows={4}
          className="w-full resize-none rounded-xl border border-purple-500/15
                     bg-[var(--theme-input-bg)] text-[var(--theme-input-text)]
                     px-4 py-3.5 text-sm leading-relaxed min-h-[44px]
                     focus:outline-none focus:border-purple-500/40
                     focus:ring-1 focus:ring-purple-500/30
                     focus:bg-[var(--theme-input-bg-focus)] transition-all duration-200 focus-ring"
          aria-label="Prompt input"
          aria-describedby="char-count"
        />
      </div>

      {/* Footer: counter + mic */}
      <div className="flex items-center justify-between px-1">
        <span id="char-count"
              className="text-[11px] text-gray-600 font-medium tabular-nums">
          {value.length}/{MAX_INPUT_CHARS} chars · {wordCount} words
        </span>
        <div className="flex items-center gap-2">
          {onClear && value.length > 0 && (
            <button
              onClick={onClear}
              className="text-[11px] font-bold text-gray-400 hover:text-red-400 px-2 py-1 transition-colors"
              aria-label="Clear input"
            >
              CLEAR
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}
