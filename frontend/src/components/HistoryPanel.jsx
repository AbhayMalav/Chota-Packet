import React, { useState, useRef, useEffect } from 'react'
import { usePinned } from '../hooks/usePinned'

function exportItems(items, format = 'json') {
  const content = format === 'json'
    ? JSON.stringify(items, null, 2)
    : items.map((h) => `--- ${new Date(h.ts).toLocaleString()} ---\nOriginal: ${h.input}\nEnhanced: ${h.enhanced}\n`).join('\n')
  const blob = new Blob([content], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `chota-history.${format}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(a.href)
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString()
}

export default function HistoryPanel({ history, onSelect, open, onClose }) {
  const { pinned, pin, unpin } = usePinned()
  const [search, setSearch] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
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

  if (!open) return null

  const allItems = [
    ...pinned.map((p) => ({ ...p, pinned: true })),
    ...history.filter((h) => !pinned.some((p) => p.enhanced === h.enhanced)).map((h) => ({ ...h, pinned: false })),
  ].filter((item) =>
    !search.trim() ||
    item.input.toLowerCase().includes(search.toLowerCase()) ||
    item.enhanced.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 glass-overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        className="fixed left-0 top-0 h-full w-80 z-50 flex flex-col animate-slide-in-left glass-sidebar"
        role="complementary"
        aria-label="Session history"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-purple-500/15">
          <div className="flex items-center gap-2">
            <span className="text-purple-400">📋</span>
            <h2 className="font-bold text-gray-200">Session History</h2>
            {allItems.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-bold">
                {allItems.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {/* ── Export Dropdown ── */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setExportOpen((o) => !o)}
                title="Export history"
                aria-haspopup="listbox"
                aria-expanded={exportOpen}
                className="text-[10px] px-2.5 py-1 rounded-full border border-purple-500/15 text-gray-500
                           hover:text-purple-400 hover:bg-purple-500/10 transition-all duration-200
                           flex items-center justify-center gap-1 min-h-[44px] md:min-h-[auto]"
              >
                Export
                <svg viewBox="0 0 20 20" fill="currentColor" className={`w-2.5 h-2.5 transition-transform duration-200 ${exportOpen ? 'rotate-180' : ''}`}>
                  <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd"/>
                </svg>
              </button>

              {exportOpen && (
                <div
                  role="listbox"
                  className="absolute right-0 top-full mt-1.5 w-36 rounded-2xl
                             glass-card shadow-xl shadow-black/20
                             py-1.5 z-10 animate-fade-in overflow-hidden"
                >
                  <button
                    role="option"
                    onClick={() => { exportItems(allItems, 'json'); setExportOpen(false) }}
                    className="w-full text-left px-3 py-2.5 text-[11px] text-[var(--theme-text)]
                               hover:text-purple-400 hover:bg-purple-500/10 transition-all duration-150"
                  >
                    📄 Export as JSON
                  </button>
                  <button
                    role="option"
                    onClick={() => { exportItems(allItems, 'txt'); setExportOpen(false) }}
                    className="w-full text-left px-3 py-2.5 text-[11px] text-[var(--theme-text)]
                               hover:text-purple-400 hover:bg-purple-500/10 transition-all duration-150"
                  >
                    📝 Export as TXT
                  </button>
                </div>
              )}
            </div>

            <button onClick={onClose} aria-label="Close history panel"
                    className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-all text-lg">
              ✕
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-purple-500/10">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search history…"
              className="w-full pl-8 pr-3 py-2 rounded-full text-xs min-h-[44px]
                         bg-[var(--theme-input-bg)] border border-purple-500/15 text-[var(--theme-input-text)]
                         placeholder-gray-600 focus:outline-none focus:border-purple-500/35
                         focus:ring-1 focus:ring-purple-500/20 transition-all duration-200 focus:bg-[var(--theme-input-bg-focus)]"
            />
          </div>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto">
          {allItems.length === 0 && (
            <div className="text-center py-16 px-6">
              <div className="text-4xl mb-3 opacity-20 animate-float">✨</div>
              <p className="text-sm text-gray-600 font-medium">No history yet</p>
              <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                Start enhancing prompts to see them here.
              </p>
            </div>
          )}
          {allItems.map((item) => (
            <div
              key={`${item.ts}-${item.enhanced}`}
              className="relative px-4 py-3.5 cursor-pointer group transition-all duration-200
                         hover:bg-purple-500/6 border-b border-purple-500/8
                         border-l-2 border-l-transparent hover:border-l-purple-500"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0" onClick={() => onSelect?.(item)}>
                  {/* Timestamp */}
                  <p className="text-[10px] text-gray-600 font-medium mb-1 flex items-center gap-1">
                    <span>🕐</span> {timeAgo(item.ts)}
                    {item.pinned && <span className="ml-1 text-amber-400">⭐</span>}
                  </p>
                  {/* Prompt preview */}
                  <p className="text-xs text-gray-300 font-medium truncate">{item.input}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">
                    {item.enhanced}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => item.pinned ? unpin(item.enhanced) : pin(item)}
                    aria-label={item.pinned ? 'Unpin' : 'Pin'}
                    className={`text-sm transition-all ${item.pinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-50 hover:!opacity-100'}`}
                  >⭐</button>
                  <button
                    onClick={() => onSelect?.(item)}
                    className="text-[10px] text-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-200
                               border border-purple-500/25 px-2 py-0.5 rounded-full hover:bg-purple-500/10"
                  >→ Load</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
