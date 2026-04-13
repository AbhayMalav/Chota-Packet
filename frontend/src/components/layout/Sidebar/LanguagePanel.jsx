import React from 'react'
import { ChevronLeft } from 'lucide-react'
import { useTheme } from '../../../context/ThemeContext'
import { LANGS } from '../../../config/constants'
import { translations } from '../../../config/translations'
import './LanguagePanel.css'

export default function LanguagePanel({ onBack, onLanguageChange, currentLanguage = 'en' }) {
  const { mode } = useTheme()
  const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)
  
  const t = translations[currentLanguage] || translations.en

  const handleLanguageSelect = (lang) => {
    onLanguageChange(lang)
  }

  return (
    <div className="language-panel" role="group" aria-label="Language settings">
      <button
        className="language-panel__back"
        onClick={onBack}
        aria-label="Back to menu"
      >
        <ChevronLeft width={14} height={14} aria-hidden="true" />
        {t.language}
      </button>

      <div className="language-panel__section">
        <p className="language-panel__label">{t.selectLanguage}</p>
        <div
          className="language-panel__options"
          role="radiogroup"
          aria-label="Language selection"
        >
          {LANGS.map(({ value }) => (
            <button
              key={value}
              role="radio"
              aria-label={value === 'en' ? t.english : t.hindi}
              aria-checked={currentLanguage === value}
              tabIndex={currentLanguage === value ? 0 : -1}
              className={`language-panel__option ${currentLanguage === value ? 'selected' : ''}`}
              onClick={() => handleLanguageSelect(value)}
            >
              {value === 'en' ? t.english : t.hindi}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}