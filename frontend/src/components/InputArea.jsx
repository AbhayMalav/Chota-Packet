import React, { useRef, useEffect } from 'react'

export default function InputArea({ value, onChange, onClear, inputLimit, children }) {
  const textareaRef = useRef(null)
  const charCount = value.length
  const isOverLimit = inputLimit != null && charCount > inputLimit

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
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          id="prompt-input"
          value={value}
          onChange={(e) => {
            const sliced = inputLimit != null
              ? e.target.value.slice(0, inputLimit)
              : e.target.value
            onChange(sliced)
          }}
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

      {/* Inline limit warning */}
      {isOverLimit && (
        <p
          role="alert"
          className="text-[11px] text-red-400 font-medium px-1 animate-fade-in flex items-center gap-1"
        >
          <span aria-hidden="true">⚠</span>
          Limit exceeded ({charCount}/{inputLimit} chars)
        </p>
      )}

      {/* Footer: counter + mic + clear */}
      <div className="flex items-center justify-between px-1">
        <span
          id="char-count"
          className="text-[11px] text-gray-600 font-medium tabular-nums"
        >
          {charCount} chars
        </span>
        <div className="flex items-center gap-2">
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              disabled={charCount === 0}
              className="text-xs font-medium px-3 py-1.5 rounded-full
                         border border-purple-500/25 text-gray-400
                         hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5
                         active:scale-[0.97] active:brightness-90
                         focus:outline-none focus-ring
                         disabled:opacity-30 disabled:cursor-not-allowed
                         transition-all duration-200"
              aria-label="Clear input"
            >
              Clear
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}
