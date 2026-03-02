import React, { useRef, useEffect } from 'react'
import { MAX_INPUT_CHARS } from '../constants'

export default function InputArea({ value, onChange, inputLang, onLangChange, children }) {
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
    <div className="relative flex flex-col gap-2">
      <div className="relative">
        <textarea
          ref={textareaRef}
          id="prompt-input"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_INPUT_CHARS))}
          placeholder="Type or paste your rough idea… (e.g. make website for shop)"
          rows={4}
          className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     placeholder-gray-400 dark:placeholder-gray-500
                     px-4 py-3 pr-24 text-sm leading-relaxed shadow-sm
                     focus:ring-2 focus:ring-violet-500 focus:border-transparent
                     transition duration-200"
          aria-label="Prompt input"
          aria-describedby="char-count"
        />

        {/* Language toggle — top-right corner inside textarea */}
        <div className="absolute top-2 right-2 flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 text-xs">
          {['en', 'hi'].map((lang) => (
            <button
              key={lang}
              onClick={() => onLangChange(lang)}
              aria-label={`Input language ${lang.toUpperCase()}`}
              className={`px-2 py-1 font-semibold transition-colors ${
                inputLang === lang
                  ? 'bg-violet-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Footer: char/word count + mic slot */}
      <div className="flex items-center justify-between px-1">
        <span id="char-count" className="text-xs text-gray-400 dark:text-gray-500">
          {value.length}/{MAX_INPUT_CHARS} chars · {wordCount} words
        </span>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </div>
  )
}
