import React from 'react'
import { SHORTCUT_GROUPS } from '../../../config/constants'
import ErrorBoundary from '../../ui/ErrorBoundary'
import './ShortcutsPanel.css'

function ShortcutRow({ entry }) {
  if (!entry || !entry.desc || !Array.isArray(entry.keys) || entry.keys.length === 0) {
    console.warn('[ShortcutsPanel] Skipping malformed shortcut entry:', entry)
    return null
  }

  return (
    <li className="shortcut-row">
      <span className="shortcut-desc">{entry.desc}</span>
      <div className="shortcut-keys">
        {entry.keys.map((k, j) => (
          <React.Fragment key={k}>
            <kbd className="shortcut-kbd">{k}</kbd>
            {j < entry.keys.length - 1 && (
              <span className="shortcut-plus" aria-hidden="true">+</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </li>
  )
}

function ShortcutsContent({ onBack }) {
  if (!SHORTCUT_GROUPS || SHORTCUT_GROUPS.length === 0) {
    return (
      <div className="shortcuts-empty">
        <svg className="shortcuts-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
        </svg>
        <p>No shortcuts configured</p>
      </div>
    )
  }

  return (
    <>
      <div className="shortcuts-header">
        <button className="shortcuts-back-btn" onClick={onBack} aria-label="Back to menu">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Shortcuts
        </button>
      </div>
      <div className="shortcuts-body">
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.group} className="shortcut-group">
            <p className="shortcut-group-label">{group.group}</p>
            <ul className="shortcuts-list">
              {group.items.map((s, i) => (
                <ShortcutRow key={`${group.group}-${i}`} entry={s} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  )
}

export default function ShortcutsPanel({ onBack }) {
  return (
    <div
      className="shortcuts-panel"
      role="dialog"
      aria-label="Keyboard shortcuts"
    >
      <ErrorBoundary fallback={<div className="shortcuts-error">Shortcuts unavailable</div>}>
        <ShortcutsContent onBack={onBack} />
      </ErrorBoundary>
    </div>
  )
}
