import React, { useState, useCallback } from 'react'
import { LS_PINNED, MAX_PINNED } from '../constants'

function usePinned() {
  const load = () => { try { return JSON.parse(localStorage.getItem(LS_PINNED) || '[]') } catch { return [] } }
  const [pinned, setPinned] = useState(load)

  const pin = useCallback((entry) => {
    setPinned((prev) => {
      if (prev.length >= MAX_PINNED) return prev
      if (prev.some((p) => p.enhanced === entry.enhanced)) return prev
      const next = [entry, ...prev]
      localStorage.setItem(LS_PINNED, JSON.stringify(next))
      return next
    })
  }, [])

  const unpin = useCallback((enhanced) => {
    setPinned((prev) => {
      const next = prev.filter((p) => p.enhanced !== enhanced)
      localStorage.setItem(LS_PINNED, JSON.stringify(next))
      return next
    })
  }, [])

  return { pinned, pin, unpin }
}

function exportItems(items, format = 'json') {
  const content = format === 'json'
    ? JSON.stringify(items, null, 2)
    : items.map((h) => `--- ${new Date(h.ts).toLocaleString()} ---\nOriginal: ${h.input}\nEnhanced: ${h.enhanced}\n`).join('\n')
  const blob = new Blob([content], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `chota-history.${format}`
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function HistoryPanel({ history, onSelect, open, onClose }) {
  const { pinned, pin, unpin } = usePinned()

  if (!open) return null

  const allItems = [
    ...pinned.map((p) => ({ ...p, pinned: true })),
    ...history.filter((h) => !pinned.some((p) => p.enhanced === h.enhanced)).map((h) => ({ ...h, pinned: false })),
  ]

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl
                    border-l border-gray-200 dark:border-gray-700 z-40 flex flex-col animate-fade-in"
         role="complementary" aria-label="Session history">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">History</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => exportItems(allItems, 'json')} aria-label="Export as JSON"
                  title="Export JSON" className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">⬇ JSON</button>
          <button onClick={() => exportItems(allItems, 'txt')} aria-label="Export as text"
                  title="Export TXT" className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">⬇ TXT</button>
          <button onClick={onClose} aria-label="Close history panel"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg">✕</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
        {allItems.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-12">No history yet</p>
        )}
        {allItems.map((item, i) => (
          <div key={i} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group">
            <div className="flex items-start justify-between gap-1">
              <div className="flex-1 min-w-0" onClick={() => onSelect?.(item)}>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{item.input}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2">{item.enhanced}</p>
                <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">{new Date(item.ts).toLocaleTimeString()}</p>
              </div>
              <button
                onClick={() => item.pinned ? unpin(item.enhanced) : pin(item)}
                aria-label={item.pinned ? 'Unpin' : 'Pin'}
                title={item.pinned ? 'Unpin' : 'Pin to top'}
                className={`text-sm flex-shrink-0 transition ${item.pinned ? 'opacity-100' : 'opacity-25 group-hover:opacity-60'}`}
              >⭐</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
