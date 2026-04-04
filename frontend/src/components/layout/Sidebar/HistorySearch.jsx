import React, { useState, useRef, useEffect, useCallback } from 'react'
import { SearchIcon, XIcon } from '../../ui/icons'
import './HistorySearch.css'


export default function HistorySearch({
  value = '',
  onChange = () => {},
  onClear = () => {},
  placeholder = 'Search prompts...',
}) {
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
        placeholder={placeholder}
        aria-label="Search history"
      />
      {localValue && (
        <button
          type="button"
          className="history-search__clear-btn"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <XIcon className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}
