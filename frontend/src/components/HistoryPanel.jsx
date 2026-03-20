import React, { useState, useRef, useEffect } from 'react'
import usePinned from '../hooks/usePinned'
import useMediaQuery from '../hooks/useMediaQuery'
import {
  SearchIcon, PinIcon, DownloadIcon,
  HistoryIcon, LoadIcon, XIcon, ChevronDownIcon,
} from './icons'

// ── Helpers ───────────────────────────────────────────────────────────────────

function exportItems(items, format = 'json') {
  const content =
    format === 'json'
      ? JSON.stringify(items, null, 2)
      : items
        .map((h) => `--- ${new Date(h.ts).toLocaleString()} ---\nOriginal: ${h.input}\nEnhanced: ${h.enhanced}\n`)
        .join('\n')

  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `chota-history.${format}`
  document.body.appendChild(a)
  try {
    a.click()
  } catch (err) {
    console.warn('[HistoryPanel] Export click failed:', err)
  } finally {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString()
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ isFiltered }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: 'rgba(127,19,236,0.08)',
          border: '1px solid rgba(127,19,236,0.12)',
          color: 'rgba(127,19,236,0.35)',
        }}
      >
        <HistoryIcon className="w-5 h-5" />
      </div>
      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--theme-text-muted)' }}>
        {isFiltered ? 'No matches found' : 'No history yet'}
      </p>
      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
        {isFiltered
          ? 'Try a different search term.'
          : 'Enhanced prompts will appear here.'}
      </p>
    </div>
  )
}

// ── History item ──────────────────────────────────────────────────────────────

function HistoryItem({ item, onSelect, onPin, onUnpin }) {
  return (
    <div
      className="group relative flex gap-3 px-4 py-3.5 transition-all duration-150
                 border-b border-l-2 cursor-pointer
                 hover:bg-purple-500/[0.04]"
      style={{
        borderBottomColor: 'rgba(127,19,236,0.08)',
        borderLeftColor: item.pinned ? '#a855f7' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!item.pinned) e.currentTarget.style.borderLeftColor = 'rgba(168,85,247,0.4)'
      }}
      onMouseLeave={(e) => {
        if (!item.pinned) e.currentTarget.style.borderLeftColor = 'transparent'
      }}
    >
      {/* Pin indicator strip colour is handled by borderLeftColor above */}

      {/* Content */}
      <div className="flex-1 min-w-0" onClick={() => onSelect?.(item)}>
        {/* Meta row */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[10px] font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
            {timeAgo(item.ts)}
          </span>
          {item.pinned && (
            <span
              className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{
                background: 'rgba(168,85,247,0.12)',
                color: '#a855f7',
              }}
            >
              <PinIcon className="w-2.5 h-2.5" filled />
              Pinned
            </span>
          )}
        </div>

        {/* Input preview */}
        <p className="text-xs font-semibold truncate mb-0.5" style={{ color: 'var(--theme-text)' }}>
          {item.input}
        </p>

        {/* Enhanced preview */}
        <p
          className="text-[11px] line-clamp-2 leading-relaxed"
          style={{ color: 'var(--theme-text-secondary)' }}
        >
          {item.enhanced}
        </p>
      </div>

      {/* Action column - visible on hover */}
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0 pt-0.5">
        {/* Pin / Unpin */}
        <button
          onClick={() => (item.pinned ? onUnpin(item.ts) : onPin(item))}
          aria-label={item.pinned ? 'Unpin prompt' : 'Pin prompt'}
          title={item.pinned ? 'Unpin' : 'Pin'}
          className="btn-icon w-7 h-7 min-w-0 min-h-0 rounded-lg transition-all duration-150"
          style={{
            color: item.pinned ? '#a855f7' : undefined,
            opacity: item.pinned ? 1 : undefined,
          }}
        >
          <PinIcon className="w-3.5 h-3.5" filled={item.pinned} />
        </button>

        {/* Load */}
        <button
          onClick={() => onSelect?.(item)}
          aria-label="Load this prompt"
          title="Load prompt"
          className="btn-icon w-7 h-7 min-w-0 min-h-0 rounded-lg
                     opacity-0 group-hover:opacity-100 transition-all duration-150"
        >
          <LoadIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HistoryPanel({ history = [], onSelect, open, onClose }) {
  const { pinned, pin, unpin } = usePinned()
  const [search, setSearch] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const dropdownRef = useRef(null)
  const searchRef = useRef(null)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // Close export dropdown on outside click
  useEffect(() => {
    if (!exportOpen) return
    const handle = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [exportOpen])

  // Focus search when panel opens on mobile
  useEffect(() => {
    if (!isDesktop && open) {
      setTimeout(() => searchRef.current?.focus(), 150)
    }
  }, [open, isDesktop])

  if (!isDesktop && !open) return null

  const allItems = [
    ...pinned.map((p) => ({ ...p, pinned: true })),
    ...history
      .filter((h) => !pinned.some((p) => p.ts === h.ts))
      .map((h) => ({ ...h, pinned: false })),
  ].filter((item) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      item.input.toLowerCase().includes(q) ||
      item.enhanced.toLowerCase().includes(q)
    )
  })

  const pinnedItems = allItems.filter((i) => i.pinned)
  const historyItems = allItems.filter((i) => !i.pinned)
  const isFiltered = search.trim().length > 0
  const isEmpty = allItems.length === 0

  const panelContent = (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3.5 flex-shrink-0 border-b"
        style={{ borderColor: 'rgba(127,19,236,0.12)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(127,19,236,0.1)',
              border: '1px solid rgba(127,19,236,0.18)',
              color: '#a855f7',
            }}
          >
            <HistoryIcon className="w-3.5 h-3.5" />
          </span>
          <div>
            <h2 className="text-sm font-bold leading-none" style={{ color: 'var(--theme-text)' }}>
              History
            </h2>
            {allItems.length > 0 && (
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
                {allItems.length} {allItems.length === 1 ? 'entry' : 'entries'}
                {pinnedItems.length > 0 && ` · ${pinnedItems.length} pinned`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Export dropdown */}
          {allItems.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setExportOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={exportOpen}
                aria-label="Export history"
                title="Export history"
                className="btn-icon w-8 h-8 min-w-0 min-h-0 rounded-lg"
              >
                <DownloadIcon className="w-3.5 h-3.5" />
              </button>

              {exportOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-1.5 w-40 rounded-xl glass-card
                             shadow-xl shadow-black/20 py-1 z-10 animate-fade-in overflow-hidden"
                >
                  <p
                    className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: 'var(--theme-text-secondary)' }}
                  >
                    Export as
                  </p>
                  {[
                    { fmt: 'json', label: 'JSON' },
                    { fmt: 'txt', label: 'Plain text' },
                  ].map(({ fmt, label }) => (
                    <button
                      key={fmt}
                      role="menuitem"
                      onClick={() => { exportItems(allItems, fmt); setExportOpen(false) }}
                      className="w-full text-left px-3 py-2 text-xs transition-all duration-150
                                 hover:bg-purple-500/10 hover:text-purple-400 flex items-center gap-2"
                      style={{ color: 'var(--theme-text)' }}
                    >
                      <DownloadIcon className="w-3 h-3 opacity-50" />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Close - mobile only */}
          {!isDesktop && (
            <button
              onClick={onClose}
              aria-label="Close history panel"
              className="btn-icon w-8 h-8 min-w-0 min-h-0 rounded-lg"
            >
              <XIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Search ── */}
      <div
        className="px-4 py-3 flex-shrink-0 border-b"
        style={{ borderColor: 'rgba(127,19,236,0.08)' }}
      >
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            <SearchIcon className="w-3.5 h-3.5" />
          </span>
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts…"
            aria-label="Search history"
            className="w-full pl-8 pr-3 py-2 rounded-lg text-xs border
                       focus:outline-none focus:border-purple-500/40
                       focus:ring-1 focus:ring-purple-500/20
                       transition-all duration-200"
            style={{
              background: 'var(--theme-input-bg)',
              color: 'var(--theme-text)',
              borderColor: 'rgba(127,19,236,0.12)',
              minHeight: '36px',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Items ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {isEmpty ? (
          <EmptyState isFiltered={isFiltered} />
        ) : (
          <>
            {/* Pinned section */}
            {pinnedItems.length > 0 && (
              <>
                <div
                  className="px-4 py-2 flex items-center gap-1.5 sticky top-0"
                  style={{
                    background: 'var(--theme-bg-sidebar)',
                    borderBottom: '1px solid rgba(127,19,236,0.06)',
                  }}
                >
                  <PinIcon className="w-3 h-3" filled style={{ color: '#a855f7' }} />
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: '#a855f7' }}
                  >
                    Pinned
                  </span>
                </div>
                {pinnedItems.map((item) => (
                  <HistoryItem
                    key={`${item.ts}-pinned`}
                    item={item}
                    onSelect={onSelect}
                    onPin={pin}
                    onUnpin={unpin}
                  />
                ))}
              </>
            )}

            {/* Recent section */}
            {historyItems.length > 0 && (
              <>
                {pinnedItems.length > 0 && (
                  <div
                    className="px-4 py-2 flex items-center gap-1.5 sticky top-0"
                    style={{
                      background: 'var(--theme-bg-sidebar)',
                      borderBottom: '1px solid rgba(127,19,236,0.06)',
                    }}
                  >
                    <HistoryIcon className="w-3 h-3" style={{ color: 'var(--theme-text-secondary)' }} />
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: 'var(--theme-text-secondary)' }}
                    >
                      Recent
                    </span>
                  </div>
                )}
                {historyItems.map((item) => (
                  <HistoryItem
                    key={`${item.ts}-${item.input.slice(0, 12)}`}
                    item={item}
                    onSelect={onSelect}
                    onPin={pin}
                    onUnpin={unpin}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )

  if (isDesktop) {
    return (
      <div
        className="flex flex-col h-full w-72 flex-shrink-0 glass-sidebar"
        style={{ borderRight: '1px solid rgba(127,19,236,0.12)' }}
        role="complementary"
        aria-label="Session history"
      >
        {panelContent}
      </div>
    )
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 glass-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed left-0 top-0 h-full w-80 z-50 flex flex-col animate-slide-in-left glass-sidebar"
        style={{ borderRight: '1px solid rgba(127,19,236,0.12)' }}
        role="complementary"
        aria-label="Session history"
      >
        {panelContent}
      </div>
    </>
  )
}
