import React, { memo, useState, useCallback, useRef, useEffect } from 'react'
import { useSidebar } from './Sidebar'
import HistoryItem from './HistoryItem'
import HistorySearch from './HistorySearch'
import HistoryExportMenu from './HistoryExportMenu'
import { usePopoverPosition } from '../../../hooks/usePopoverPosition'
import { exportBulk } from '../../../services/exportService'
import { translations } from '../../../config/translations'
import { useTheme } from '../../../context/ThemeContext'
import './HistorySection.css'

const MAX_HISTORY_ITEMS = 5
const MAX_PINNED_WARN = 50

function getItemId(item) {
  return item.id ?? item.ts ?? null
}

function getItemLabel(item) {
  return item.prompt ?? item.input ?? ''
}

const HistorySection = memo(function HistorySection({ history, onSelect, activeItemId }) {
  const { language } = useTheme()
  const t = translations[language] || translations.en

  const isCollapsed = useSidebar()
  const [isExpanded, setIsExpanded] = useState(false)
  const [pinnedIds, setPinnedIds] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [showBulkExport, setShowBulkExport] = useState(false)
  const [toast, setToast] = useState(null)
  const overflowBtnRef = useRef(null)
  const bulkExportMenuRef = useRef(null)
  const toastTimerRef = useRef(null)

  const { position, recalculate } = usePopoverPosition(overflowBtnRef, bulkExportMenuRef, {
    preferSide: 'right',
    preferVertical: 'down',
    gap: 8,
    estimatedWidth: 240,
  })

  useEffect(() => {
    if (showBulkExport && recalculate) {
      const timer = setTimeout(recalculate, 0)
      return () => clearTimeout(timer)
    }
  }, [showBulkExport, recalculate])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  const rawItems = Array.isArray(history) ? history : []

  const items = rawItems.filter(item => {
    if (!item || (item.id == null && item.prompt == null && item.input == null)) {
      console.warn('Skipping malformed history item', item)
      return false
    }
    return true
  })

  const filteredItems = searchQuery
    ? items.filter(item => {
        const label = getItemLabel(item).toLowerCase()
        return label.includes(searchQuery.toLowerCase())
      })
    : items

  const isSearching = searchQuery.length > 0
  const displayedItems = isSearching ? filteredItems : (isExpanded ? items : items.slice(0, MAX_HISTORY_ITEMS))

  const handlePin = useCallback((itemId) => {
    setPinnedIds(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
        if (next.size > MAX_PINNED_WARN) {
          console.warn('[HistorySection] Unusual number of pinned items:', next.size)
        }
      }
      return next
    })
  }, [])

  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query)
  }, [])

  const handleSearchClear = useCallback(() => {
    setSearchQuery('')
  }, [])

  const showToast = useCallback((message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(message)
    toastTimerRef.current = setTimeout(() => {
      setToast(null)
      toastTimerRef.current = null
    }, 2500)
  }, [])

  const handleBulkExportClose = useCallback(() => {
    setShowBulkExport(false)
  }, [])

  const handleBulkExportSelect = useCallback((format) => {
    if (displayedItems.length === 0) {
      showToast('Nothing to export')
      return
    }
    exportBulk(displayedItems, format)
    setShowBulkExport(false)
  }, [displayedItems, showToast, setShowBulkExport])

  if (isCollapsed) return null

  const pinnedItems = displayedItems
    .filter(i => pinnedIds.has(getItemId(i)))
    .sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0))

  const unpinnedItems = displayedItems
    .filter(i => !pinnedIds.has(getItemId(i)))
    .sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0))

  const hasPinned = pinnedItems.length > 0
  const hasUnpinned = unpinnedItems.length > 0
  const hasMore = !isSearching && items.length > MAX_HISTORY_ITEMS
  const showNoResults = displayedItems.length === 0 && (items.length > 0 || isSearching)
  const hasHistory = items.length > 0

  return (
    <section
      className={`history-section ${isExpanded ? 'history-section--expanded' : ''}`}
      aria-label={t.history}
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
        <h2 className="history-section__heading">{t.history}</h2>
        {hasHistory && (
          <div className="history-section__header-actions">
            <button
              ref={overflowBtnRef}
              className="history-section__overflow-btn"
              onClick={() => setShowBulkExport(true)}
              aria-label="Export history options"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {showBulkExport && (
        <HistoryExportMenu
          ref={bulkExportMenuRef}
          items={displayedItems}
          onClose={handleBulkExportClose}
          onSelect={handleBulkExportSelect}
          position={position}
          filteredCount={displayedItems.length}
        />
      )}

      <HistorySearch
        value={searchQuery}
        onChange={handleSearchChange}
        onClear={handleSearchClear}
      />

      <div className="history-section__list" role="list">
        {showNoResults ? (
          <div className="history-section__empty">
            <svg
              className="history-section__empty-icon"
              width="28" height="28" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 15s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
            <p className="history-section__empty-text">{t.noMatchesFound}</p>
          </div>
        ) : displayedItems.length === 0 ? (
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
            <p className="history-section__empty-text">{t.noHistory}</p>
          </div>
        ) : (
          <>
            {hasPinned && (
              <>
                <div className="history-section__group-label">
                  <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M9.828 3.009a.75.75 0 01.727.182l5.254 5.254a.75.75 0 01-.499 1.285l-1.56.013-2.835 2.836.013 1.56a.75.75 0 01-1.285.499L4.39 9.385a.75.75 0 01.499-1.285l1.56-.013 2.836-2.835-.013-1.56a.75.75 0 01.556-.683zM3.22 14.97a.75.75 0 011.06 0l1.5 1.5a.75.75 0 11-1.06 1.06l-1.5-1.5a.75.75 0 010-1.06z" />
                  </svg>
                  {t.pinned}
                </div>
                {pinnedItems.map((item, index) => {
                  const idForActive = getItemId(item)
                  const key = idForActive ?? `pinned-${index}`
                  return (
                    <HistoryItem
                      key={key}
                      item={item}
                      isActive={activeItemId === idForActive}
                      isPinned
                      onSelect={onSelect}
                      onPin={handlePin}
                    />
                  )
                })}
              </>
            )}

            {hasPinned && hasUnpinned && (
              <div className="history-section__divider" />
            )}

            {hasUnpinned && (
              unpinnedItems.map((item, index) => {
                const idForActive = getItemId(item)
                const key = idForActive ?? `unpinned-${index}`
                return (
                  <HistoryItem
                    key={key}
                    item={item}
                    isActive={activeItemId === idForActive}
                    isPinned={false}
                    onSelect={onSelect}
                    onPin={handlePin}
                  />
                )
              })
            )}
          </>
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
                {t.close}
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                {t.viewAll.replace('{count}', `(${items.length})`)}
              </>
            )}
          </button>
        </div>
      )}

      {toast && (
        <div className="history-section__toast" role="alert" aria-live="polite">
          {toast}
        </div>
      )}
    </section>
  )
})

export default HistorySection