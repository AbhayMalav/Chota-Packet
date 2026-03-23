import React, { useRef, useEffect } from 'react'
import { ExclamationTriangleIcon } from './icons'
import '../styles/components/InputArea.css'


export default function InputArea({
  value = '',
  onChange = () => { },
  onClear = () => { },
  inputLimit,
  children,
}) {
  const textareaRef = useRef(null)
  const charCount = value.length
  const isOverLimit = inputLimit != null && charCount > inputLimit


  // Auto-resize textarea up to 280px
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
        <label
          htmlFor="prompt-input"
          className="text-[11px] font-bold uppercase tracking-widest text-purple-400/70"
        >
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
            const sliced =
              inputLimit != null
                ? e.target.value.slice(0, inputLimit)
                : e.target.value
            onChange(sliced)
          }}
          placeholder="Type or paste your prompt here…"
          rows={4}
          className="input-area__textarea bg-input text-theme w-full resize-none rounded-xl border border-purple-500/15
                     px-4 py-3.5 text-sm leading-relaxed min-h-[44px]
                     focus:outline-none focus:border-purple-500/40
                     focus:ring-1 focus:ring-purple-500/30
                     transition-all duration-200 focus-ring"
          aria-label="Prompt input"
          aria-describedby="char-count"
        />
      </div>

      {/* Footer: counter + mic + clear */}
      <div className="flex items-center justify-between px-3 pb-3 pt-1 gap-2">
        <span
          id="char-count"
          aria-live="polite"
          className={`flex items-center gap-1 text-xs transition-colors ${isOverLimit ? 'text-red-400 font-medium' : 'text-secondary'
            }`}
        >
          {isOverLimit && <ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />}
          {isOverLimit
            ? `Limit exceeded (${charCount}/${inputLimit} chars)`
            : inputLimit != null
              ? `${charCount} / ${inputLimit}`
              : `${charCount}`}
        </span>

        {/* Mic + Clear - fixed height container prevents mic-pulse layout shift */}
        <div className="flex items-center gap-1.5 min-h-[40px]">
          {children}
          {value.trim() && (
            <button
              onClick={onClear}
              className="btn-ghost"
              aria-label="Clear input"
              title="Clear input (Ctrl+K)"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
