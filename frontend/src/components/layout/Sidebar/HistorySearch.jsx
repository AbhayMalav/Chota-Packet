import React, { useState, useRef, useEffect, useCallback } from 'react'
import { SearchIcon, XIcon } from '../../ui/icons'
import { translations } from '../../../config/translations'
import { useTheme } from '../../../context/ThemeContext'
import './HistorySearch.css'


export default function HistorySearch({
  value = '',
  onChange = () => {},
  onClear = () => {},
}) {
  const { language } = useTheme()
  const t = translations[language] || translations.en
  
  const [localValue, setLocalValue] = useState(value)
  const timerRef = useRef(null)

  const debouncedChange = useCallback((val) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => {
      onChange(val)
    }, 300)
  }, [onChange])

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const handleChange = (e) => {
    const val = e.target.value
    setLocalValue(val)
    debouncedChange(val)
  }

  const handleClear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setLocalValue('')
    onClear()
  }

  return (
    <div className="history-search">
      <SearchIcon className="history-search__icon" />
      <input
        type="text"
        className="history-search__input"
        value={localValue}
        onChange={handleChange}
        placeholder={t.searchPrompts}
        aria-label={t.searchHistory}
      />
      {localValue && (
        <button
          type="button"
          className="history-search__clear-btn"
          onClick={handleClear}
          aria-label={t.clearSearch}
        >
          <XIcon className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}