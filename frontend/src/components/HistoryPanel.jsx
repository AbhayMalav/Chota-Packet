import React, { useState, useRef, useEffect } from 'react'
import usePinned from '../hooks/usePinned'
import useMediaQuery from '../hooks/useMediaQuery'
import {
  SearchIcon, PinIcon, DownloadIcon,
  HistoryIcon, LoadIcon, XIcon,
  ChevronLeftIcon, GearIcon, SunIcon, MoonIcon,
} from './icons'
import '../styles/components/HistoryPanel.css'


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
      <div className="history-empty__icon w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
        <HistoryIcon className="w-5 h-5" />
      </div>
      <p className="text-muted text-sm font-semibold mb-1">
        {isFiltered ? 'No matches found' : 'No history yet'}
      </p>
      <p className="text-secondary text-[11px] leading-relaxed">
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
      className={`history-item group relative flex gap-3 px-4 py-3.5 transition-all duration-150 border-b border-l-2 cursor-pointer hover:bg-purple-500/[0.04]${item.pinned ? ' history-item--pinned' : ''}`}
    >
      {/* Content */}
      <div className="flex-1 min-w-0" onClick={() => onSelect?.(item)}>
        {/* Meta row */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-secondary text-[10px] font-medium">
            {timeAgo(item.ts)}
          </span>
          {item.pinned && (
            <span className="history-item__pin-badge flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
              <PinIcon className="w-2.5 h-2.5" filled />
              Pinned
            </span>
          )}
        </div>

        {/* Input preview */}
        <p className="text-theme text-xs font-semibold truncate mb-0.5">
          {item.input}
        </p>

        {/* Enhanced preview */}
        <p className="text-secondary text-[11px] line-clamp-2 leading-relaxed">
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
          className={`btn-icon w-7 h-7 min-w-0 min-h-0 rounded-lg transition-all duration-150${item.pinned ? ' history-item__pin-btn--active' : ''}`}
        >
          <PinIcon className="w-3.5 h-3.5" filled={item.pinned} />
        </button>

        {/* Load */}
        <button
          onClick={() => onSelect?.(item)}
          aria-label="Load this prompt"
          title="Load prompt"
          className="btn-icon w-7 h-7 min-w-0 min-h-0 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150"
        >
          <LoadIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}


// ── Main component ────────────────────────────────────────────────────────────


export default function HistoryPanel({
  history = [],
  onSelect,
  open,
  onClose,
  collapsed = false,
  onToggle,
  onOpenSettings,
  darkMode,
  onToggleDark,
}) {
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


  // ── Sidebar footer (Settings + Theme, desktop only) ───────────────────────
  const sidebarFooter = (
    <div className="sidebar__footer">
      <button
        onClick={onOpenSettings}
        aria-label="Settings"
        title="Settings"
        className="sidebar__footer-btn"
      >
        <GearIcon className="w-4 h-4 flex-shrink-0" />
        {!collapsed && <span className="sidebar__label">Settings</span>}
      </button>
      <button
        onClick={onToggleDark}
        aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className="sidebar__footer-btn"
      >
        {darkMode
          ? <SunIcon className="w-4 h-4 flex-shrink-0" />
          : <MoonIcon className="w-4 h-4 flex-shrink-0" />
        }
        {!collapsed && (
          <span className="sidebar__label">
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </span>
        )}
      </button>
    </div>
  )


  const panelContent = (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="history-panel__header flex items-center justify-between px-3 py-3.5 flex-shrink-0 border-b">
        <div className="flex items-center gap-2 min-w-0">
          <span className="history-panel__header-icon w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0">
            <HistoryIcon className="w-3.5 h-3.5" />
          </span>
          {!collapsed && (
            <div className="sidebar__label min-w-0">
              <h2 className="text-theme text-sm font-bold leading-none">
                History
              </h2>
              {allItems.length > 0 && (
                <p className="text-secondary text-[10px] mt-0.5">
                  {allItems.length} {allItems.length === 1 ? 'entry' : 'entries'}
                  {pinnedItems.length > 0 && ` · ${pinnedItems.length} pinned`}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Export dropdown — expanded mode only */}
          {!collapsed && allItems.length > 0 && (
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
                  className="absolute right-0 top-full mt-1.5 w-40 rounded-xl glass-card shadow-xl shadow-black/20 py-1 z-10 animate-fade-in overflow-hidden"
                >
                  <p className="text-secondary px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest">
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
                      className="history-panel__export-item w-full text-left px-3 py-2 text-xs transition-all duration-150 hover:bg-purple-500/10 hover:text-purple-400 flex items-center gap-2"
                    >
                      <DownloadIcon className="w-3 h-3 opacity-50" />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Collapse toggle — desktop only */}
          {isDesktop && (
            <button
              onClick={onToggle}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="btn-icon sidebar__toggle-btn w-8 h-8 min-w-0 min-h-0 rounded-lg"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
          )}

          {/* Close — mobile only */}
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
      {!collapsed && (
        <div className="history-panel__search-section px-4 py-3 flex-shrink-0 border-b">
          <div className="relative">
            <span className="text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <SearchIcon className="w-3.5 h-3.5" />
            </span>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts…"
              aria-label="Search history"
              className="history-panel__search-input w-full pl-8 pr-3 py-2 rounded-lg text-xs border focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all duration-200"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="text-secondary absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Items ── */}
      {!collapsed && (
        <div className="history-panel__list flex-1 overflow-y-auto">
          {isEmpty ? (
            <EmptyState isFiltered={isFiltered} />
          ) : (
            <>
              {/* Pinned section */}
              {pinnedItems.length > 0 && (
                <>
                  <div className="history-panel__section-header px-4 py-2 flex items-center gap-1.5 sticky top-0">
                    <PinIcon className="history-panel__accent-label w-3 h-3" filled />
                    <span className="history-panel__accent-label text-[10px] font-bold uppercase tracking-widest">
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
                    <div className="history-panel__section-header px-4 py-2 flex items-center gap-1.5 sticky top-0">
                      <HistoryIcon className="text-secondary w-3 h-3" />
                      <span className="text-secondary text-[10px] font-bold uppercase tracking-widest">
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
      )}

      {/* Collapsed: flex spacer pushes footer to bottom */}
      {collapsed && <div className="flex-1" />}

      {/* ── Footer: Settings + Theme (desktop sidebar only) ── */}
      {isDesktop && sidebarFooter}

    </div>
  )


  if (isDesktop) {
    return (
      <div
        className={`flex flex-col h-full flex-shrink-0 glass-sidebar${collapsed ? ' sidebar-collapsed' : ''}`}
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
        role="complementary"
        aria-label="Session history"
      >
        {panelContent}
      </div>
    </>
  )
}
