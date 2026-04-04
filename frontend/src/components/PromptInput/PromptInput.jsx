import React, { useRef, useEffect } from 'react'
import { ExclamationTriangleIcon } from '../ui/icons'
import SendButton from './SendButton'
import './PromptInput.css'


export default function PromptInput({
  value = '',
  onChange = () => { },
  onClear = () => { },
  onSubmit = () => { },
  inputLimit,
  isLoading = false,
  children,
}) {
  const textareaRef = useRef(null)
  const charCount = value.length
  const isOverLimit = inputLimit != null && charCount > inputLimit
  const canSend = value.trim() !== ''


  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 280) + 'px'
  }, [value])


  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-0.5">
        <label
          htmlFor="prompt-input"
          className="text-[11px] font-bold uppercase tracking-widest text-purple-400/70"
        >
          Input Prompt
        </label>
      </div>

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
          className="prompt-input__textarea bg-input text-theme w-full resize-none rounded-xl border border-purple-500/15
                     px-4 py-3.5 text-sm leading-relaxed min-h-[44px]
                     focus:outline-none focus:border-purple-500/40
                     focus:ring-1 focus:ring-purple-500/30
                     transition-all duration-200 focus-ring"
          aria-label="Prompt input"
          aria-describedby="char-count"
        />
      </div>

      <div className="controls-row">
        <span
          id="char-count"
          aria-live="polite"
          className={`char-count ${isOverLimit ? 'char-count--danger' : ''}`}
        >
          {isOverLimit && <ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />}
          {isOverLimit
            ? `Limit exceeded (${charCount}/${inputLimit} chars)`
            : inputLimit != null
              ? `${charCount} / ${inputLimit}`
              : `${charCount}`}
        </span>

        <div className="button-group">
          {canSend && (
            <button
              onClick={onClear}
              className="btn-ghost"
              aria-label="Clear input"
              title="Clear input (Ctrl+K)"
            >
              Clear
            </button>
          )}
          {children}
          <SendButton
            onSubmit={onSubmit}
            disabled={!canSend}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
