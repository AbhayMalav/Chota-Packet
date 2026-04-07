import React, { memo, useState, useRef, useEffect } from 'react'
import { PinIcon, DownloadIcon } from '../../ui/icons'
import HistoryExportMenu from './HistoryExportMenu'
import { usePopoverPosition } from '../../../hooks/usePopoverPosition'
import './HistoryItem.css'


function formatRelativeTime(ts) {
  if (!ts) return ''
  const diff = Date.now() - ts
  if (diff < 0) return 'just now'
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}


const HistoryItem = memo(function HistoryItem({
  item,
  isActive = false,
  isPinned = false,
  onSelect = () => {},
  onPin = () => {},
}) {
  const [hovered, setHovered] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const exportTriggerRef = useRef(null)
  const exportMenuRef = useRef(null)
  const label = item.prompt ?? item.input ?? 'untitled'
  const itemId = item.id ?? item.ts

  const { position, recalculate } = usePopoverPosition(exportTriggerRef, exportMenuRef, {
    preferSide: 'right',
    preferVertical: 'down',
    gap: 8,
    estimatedWidth: 200,
  })

  useEffect(() => {
    if (showExport && recalculate) {
      const timer = setTimeout(recalculate, 0)
      return () => clearTimeout(timer)
    }
  }, [showExport, recalculate])

  const handlePinClick = (e) => {
    e.stopPropagation()
    if (itemId == null) {
      console.warn('[HistoryItem] Cannot pin item without id:', item)
      return
    }
    onPin(itemId)
  }

  const handleExportClick = (e) => {
    e.stopPropagation()
    setShowExport((prev) => !prev)
  }

  const handleExportClose = () => setShowExport(false)

  const showActions = isPinned || hovered

  return (
    <div
      className={`history-item ${isActive ? 'history-item--active' : ''} ${isPinned ? 'history-item--pinned' : ''}`}
      onClick={() => onSelect(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false)
        if (!isPinned) handleExportClose()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(item)
        }
      }}
      title={label}
      role="button"
      tabIndex="0"
      aria-label={`Load ${label}`}
    >
      <span className="history-item__content">
        <span className="history-item__text">{label}</span>
        {item.ts && (
          <span className="history-item__time">{formatRelativeTime(item.ts)}</span>
        )}
      </span>
      {showActions && (
        <div className="history-item__actions">
          <button
            ref={exportTriggerRef}
            className="history-item__action-btn"
            onClick={handleExportClick}
            aria-label="Export this prompt"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                handleExportClick(e)
              }
            }}
          >
            <DownloadIcon className="w-3.5 h-3.5" />
          </button>
          <button
            className="history-item__action-btn"
            onClick={handlePinClick}
            aria-label={isPinned ? 'Unpin prompt' : 'Pin prompt'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                handlePinClick(e)
              }
            }}
          >
            <PinIcon className="w-3.5 h-3.5" filled={isPinned} />
          </button>
        </div>
      )}
      {showExport && (
        <HistoryExportMenu
          ref={exportMenuRef}
          items={[item]}
          onClose={handleExportClose}
          position={position}
        />
      )}
    </div>
  )
})


export default HistoryItem