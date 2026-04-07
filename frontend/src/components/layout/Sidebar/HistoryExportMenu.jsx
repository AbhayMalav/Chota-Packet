import React, { useRef, useEffect, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { exportSingleItem, exportBulk } from '../../../services/exportService'
import './HistoryExportMenu.css'


const FORMATS = [
  { key: 'markdown', label: 'Markdown', ext: '.md' },
  { key: 'plaintext', label: 'Plain Text', ext: '.txt' },
  { key: 'json', label: 'JSON', ext: '.json' },
]


function HistoryExportMenu({
  triggerRef,
  items,
  onSelect,
  onClose,
  filteredCount,
  position,
}) {
  const ref = useRef(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target) && !triggerRef?.current?.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose, triggerRef, isMounted])

  useEffect(() => {
    if (!isMounted) return
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose, isMounted])

  const handleSelect = useCallback((fmt) => {
    if (items.length === 1) {
      exportSingleItem(items[0], fmt)
    } else {
      exportBulk(items, fmt)
    }
    onSelect?.(fmt)
    onClose()
  }, [items, onSelect, onClose])

  const isBulk = items.length > 1

  const menu = (
    <div
      ref={ref}
      className="history-export-menu"
      style={{
        position: 'fixed',
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        right: position.right,
        zIndex: 9999,
      }}
      role="menu"
      aria-label="Export format options"
    >
      {FORMATS.map((fmt) => (
        <button
          key={fmt.key}
          className="history-export-menu__option"
          onClick={() => handleSelect(fmt.key)}
          role="menuitem"
        >
          <span className="history-export-menu__label">
            {isBulk ? `Export All as ${fmt.label}` : fmt.label}
          </span>
          <span className="history-export-menu__ext">{fmt.ext}</span>
        </button>
      ))}
    </div>
  )

  if (!isMounted) return null

  return createPortal(menu, document.body)
}


export default HistoryExportMenu
