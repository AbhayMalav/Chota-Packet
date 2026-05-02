import React, { useRef, useEffect} from 'react'
import { ExclamationTriangleIcon } from '../ui/icons'
import SendButton from './SendButton'
import useTranslation from '../../hooks/useTranslation'
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
  const { t } = useTranslation()
  const textareaRef = useRef(null)
  const onClearRef = useRef(onClear)
  useEffect(() => {
    onClearRef.current = onClear
  }, [onClear])
  const charCount = value.length
  const isOverLimit = inputLimit != null && charCount > inputLimit
  const canSend = value.trim() !== ''



  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 280) + 'px'
  }, [value])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        const active = document.activeElement
        if (active && active.tagName === 'TEXTAREA' && active.id === 'prompt-input') {
          e.preventDefault()
          onClearRef.current()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])



  return (
    <div className="glass-card p-4 flex flex-col gap-3 rounded-2xl">
      <div className="flex items-center justify-between">
        <label
          htmlFor="prompt-input"
          className="text-xs font-semibold tracking-wider text-theme-secondary uppercase"
        >
          {t.enterPrompt}
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
          placeholder={t.enterPrompt}
          rows={4}
          className="prompt-input__textarea"
          aria-describedby="char-count"
        />
      </div>

      <div className="controls-row flex items-center gap-3">
        <span
          id="char-count"
          aria-live="polite"
          className={`char-count ${isOverLimit ? 'char-count--danger' : ''}`}
        >
          {isOverLimit && <ExclamationTriangleIcon className="char-count__icon" />}
          {isOverLimit
            ? `Limit exceeded (${charCount}/${inputLimit} chars)`
            : inputLimit != null
              ? `${charCount} / ${inputLimit}`
              : `${charCount}`}
        </span>

        <div className="button-group flex items-center gap-2">
          {canSend && (
            <button
              onClick={onClear}
              className="btn-ghost touch-target"
              aria-label="Clear input"
              title={`${t.clear} (Ctrl+K)`}
            >
              {t.clear}
            </button>
          )}
          {children}
          <SendButton
            onSubmit={onSubmit}
            disabled={!canSend}
            isLoading={isLoading}
            className="touch-target"
          />
        </div>
      </div>
    </div>
  );
}