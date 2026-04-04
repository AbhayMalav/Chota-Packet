import React, { memo, useState } from 'react'
import { PinIcon } from '../../ui/icons'
import './HistoryItem.css'


function formatRelativeTime(ts) {
  if (!ts) return ''
  const diff = Date.now() - ts
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
  const label = item.prompt ?? item.input ?? 'untitled'
  const itemId = item.id ?? item.ts

  const handlePinClick = (e) => {
    e.stopPropagation()
    if (itemId == null) {
      console.warn('[HistoryItem] Cannot pin item without id:', item)
      return
    }
    onPin(itemId)
  }

  const showPin = isPinned || hovered

  return (
    <button
      className={`history-item ${isActive ? 'history-item--active' : ''} ${isPinned ? 'history-item--pinned' : ''}`}
      onClick={() => onSelect(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={label}
      aria-label={`Load ${label}`}
    >
      <span className="history-item__content">
        <span className="history-item__text">{label}</span>
        {item.ts && (
          <span className="history-item__time">{formatRelativeTime(item.ts)}</span>
        )}
      </span>
      {showPin && (
        <span
          className="history-item__pin-btn"
          onClick={handlePinClick}
          role="button"
          tabIndex={0}
          aria-label={isPinned ? 'Unpin prompt' : 'Pin prompt'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation()
              handlePinClick(e)
            }
          }}
        >
          <PinIcon className="w-3 h-3" filled={isPinned} />
        </span>
      )}
    </button>
  )
})


export default HistoryItem
