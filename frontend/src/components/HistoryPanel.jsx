import React, { useState, useRef, useEffect } from 'react'
import { usePinned } from '../hooks/usePinned'
import { useMediaQuery } from '../hooks/useMediaQuery'

// ── Helpers ───────────────────────────────────────────────────────────────────

function exportItems(items, format = 'json') {
  const content =
    format === 'json'
      ? JSON.stringify(items, null, 2)
      : items
          .map(
            (h) =>
              `--- ${new Date(h.ts).toLocaleString()} ---\nOriginal: ${h.input}\nEnhanced: ${h.enhanced}\n`
          )
          .join('\n')

  const blob = new Blob([content], { type: 'text/plain' })
  // Capture URL before assignment so revokeObjectURL always has the right reference
  const url = URL.createObjectURL(blob)
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
  if (diff < 60_000)     return 'Just now'
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString()
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HistoryPanel({ history = [], onSelect, open, onClose }) {
  const { pinned, pin, unpin } = usePinned()
  const [search, setSearch] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Renamed from isPinned — this checks viewport width, not pin state
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // Close export dropdown on outside click
  useEffect(() => {
    if (!exportOpen) return
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [exportOpen])

  // On mobile, hide the panel entirely when closed
  if (!isDesktop && !open) return null

  // Dedup by timestamp (unique per entry), not by enhanced text.
  // Two different inputs that produce identical output are distinct entries.
  const allItems = [
    ...pinned.map((p) => ({ ...p, pinned: true })),
    ...history
      .filter((h) => !pinned.some((p) => p.ts === h.ts))
      .map((h) => ({ ...h, pinned: false })),
  ].filter(
    (item) =>
      !search.trim() ||
      item.input.toLowerCase().includes(search.toLowerCase()) ||
      item.enhanced.toLowerCase().includes(search.toLowerCase())
  )

  const panelContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-purple-500/15">
        <div className="flex items-center gap-2">
          <h2 className="font-bold" style={{ color: 'var(--theme-text)' }}>
            Session History
          </h2>
          {allItems.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-bold">
              {allItems.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Export dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setExportOpen((o) => !o)}
              title="Export history"
              aria-haspopup="menu"
              aria-expanded={exportOpen}
              className="text-[10px] px-2.5 py-1 rounded-full border border-purple-500/15 min-h-[44px] md:min-h-auto flex items-center gap-1 transition-all duration-200 hover:text-purple-400 hover:bg-purple-500/10"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
              Export
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-2.5 h-2.5 transition-transform duration-200 ${exportOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {exportOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-1.5 w-36 rounded-2xl glass-card shadow-xl py-1.5 z-10 animate-fade-in overflow-hidden"
              >
                <button
                  role="menuitem"
                  onClick={() => { exportItems(allItems, 'json'); setExportOpen(false) }}
                  className="w-full text-left px-3 py-2.5 text-[11px] transition-all duration-150 hover:text-purple-400 hover:bg-purple-500/10"
                  style={{ color: 'var(--theme-text)' }}
                >
                  Export as JSON
                </button>
                <button
                  role="menuitem"
                  onClick={() => { exportItems(allItems, 'txt'); setExportOpen(false) }}
                  className="w-full text-left px-3 py-2.5 text-[11px] transition-all duration-150 hover:text-purple-400 hover:bg-purple-500/10"
                  style={{ color: 'var(--theme-text)' }}
                >
                  Export as TXT
                </button>
              </div>
            )}
          </div>

          {/* Close button — only shown on mobile (desktop panel is always visible) */}
          {!isDesktop && (
            <button
              onClick={onClose}
              aria-label="Close history panel"
              className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-all text-lg hover:bg-white/5"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-purple-500/10">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search history…"
            aria-label="Search history"
            className="w-full pl-8 pr-3 py-2 rounded-full text-xs min-h-[44px] border border-purple-500/15 focus:outline-none focus:border-purple-500/35 focus:ring-1 focus:ring-purple-500/20 transition-all duration-200"
            style={{
              background: 'var(--theme-input-bg)',
              color: 'var(--theme-text)',
            }}
          />
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto">
        {allItems.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="text-4xl mb-3 opacity-20 animate-float">🕐</div>
            <p className="text-sm font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
              No history yet
            </p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
              Start enhancing prompts to see them here.
            </p>
          </div>
        ) : (
          allItems.map((item) => (
            <div
              key={`${item.ts}-${item.input.slice(0, 12)}`}
              className="relative px-4 py-3.5 cursor-pointer group transition-all duration-200 hover:bg-purple-500/6 border-b border-purple-500/8 border-l-2 border-l-transparent hover:border-l-purple-500"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0" onClick={() => onSelect?.(item)}>
                  {/* Timestamp */}
                  <p className="text-[10px] font-medium mb-1 flex items-center gap-1" style={{ color: 'var(--theme-text-secondary)' }}>
                    <span>🕐</span>
                    {timeAgo(item.ts)}
                    {item.pinned && <span className="ml-1 text-amber-400">⭐</span>}
                  </p>

                  {/* Prompt preview */}
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--theme-text)' }}>
                    {item.input}
                  </p>
                  <p className="text-[11px] mt-0.5 line-clamp-2 leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                    {item.enhanced}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  {/* Pin / Unpin */}
                  <button
                    onClick={() => (item.pinned ? unpin(item.enhanced) : pin(item))}
                    aria-label={item.pinned ? 'Unpin' : 'Pin'}
                    className={`text-sm transition-all ${item.pinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-50 hover:!opacity-100'}`}
                  >
                    {item.pinned ? '⭐' : '☆'}
                  </button>

                  {/* Load button */}
                  <button
                    onClick={() => onSelect?.(item)}
                    className="text-[10px] text-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-200 border border-purple-500/25 px-2 py-0.5 rounded-full hover:bg-purple-500/10"
                  >
                    Load
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )

  // Desktop: static sidebar (always visible, no backdrop)
  if (isDesktop) {
    return (
      <div
        className="flex flex-col h-full w-72 flex-shrink-0 glass-sidebar border-r border-purple-500/15"
        role="complementary"
        aria-label="Session history"
      >
        {panelContent}
      </div>
    )
  }

  // Mobile/tablet: slide-in drawer with backdrop
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 glass-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div
        className="fixed left-0 top-0 h-full w-80 z-50 flex flex-col animate-slide-in-left glass-sidebar"
        role="complementary"
        aria-label="Session history"
      >
        {panelContent}
      </div>
    </>
  )
}
