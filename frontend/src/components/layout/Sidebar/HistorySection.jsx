import React, { memo, useState } from 'react'
import { useSidebar } from './Sidebar'
import './HistorySection.css'

const MAX_HISTORY_ITEMS = 5

const HistorySection = memo(function HistorySection({ history, onSelect }) {
  const isCollapsed = useSidebar()
  const [isExpanded, setIsExpanded] = useState(false)

  const rawItems = Array.isArray(history) ? history : []

  const items = rawItems.filter(item => {
    if (!item || (item.id == null && item.prompt == null && item.input == null)) {
      console.warn('Skipping malformed history item', item)
      return false
    }
    return true
  })

  if (isCollapsed) return null

  const displayedItems = isExpanded ? items : items.slice(0, MAX_HISTORY_ITEMS)
  const hasMore = items.length > MAX_HISTORY_ITEMS

  return (
    <section
      className={`history-section ${isExpanded ? 'history-section--expanded' : ''}`}
      aria-label="Session History"
    >
      <div className="history-section__header">
        <svg
          className="history-section__heading-icon"
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <h2 className="history-section__heading">History</h2>
      </div>

      <div className="history-section__list" role="list">
        {displayedItems.length === 0 ? (
          <div className="history-section__empty">
            <svg
              className="history-section__empty-icon"
              width="28" height="28" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <p className="history-section__empty-text">No history yet</p>
          </div>
        ) : (
          displayedItems.map(item => {
            const key = item.id ?? item.ts ?? item.input?.slice(0, 12)
            const label = item.prompt ?? item.input ?? 'untitled'
            return (
              <button
                key={key}
                role="listitem"
                className="history-section__item"
                onClick={() => onSelect?.(item)}
                title={label}
                aria-label={`Load ${label}`}
              >
                <span className="history-section__item-label">{label}</span>
              </button>
            )
          })
        )}
      </div>

      {hasMore && (
        <div className="history-section__footer">
          <button
            className="history-section__view-all"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
                Collapse
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                View All ({items.length})
              </>
            )}
          </button>
        </div>
      )}
    </section>
  )
})

export default HistorySection