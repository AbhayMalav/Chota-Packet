import React, { useEffect, useRef } from 'react'
import { XIcon } from './icons'
import '../styles/components/ShortcutsModal.css'


// ─── Shortcut definitions — must exactly match bindings in App.jsx ────────────


const SHORTCUT_GROUPS = [
  {
    group: 'Generation',
    items: [
      { keys: ['Ctrl', 'Enter'], desc: 'Enhance prompt' },
      { keys: ['Ctrl', 'Shift', 'Enter'], desc: 'Regenerate (variant)' },
      { keys: ['Ctrl', 'Shift', 'M'], desc: 'Toggle voice input' },
    ],
  },
  {
    group: 'Output',
    items: [
      { keys: ['Ctrl', 'Shift', 'C'], desc: 'Copy output to clipboard' },
      { keys: ['Ctrl', 'Shift', 'V'], desc: 'Toggle compare view' },
      { keys: ['Ctrl', 'L'], desc: 'Clear output only' },
      { keys: ['Ctrl', 'Shift', 'K'], desc: 'Clear everything' },
    ],
  },
  {
    group: 'Navigation',
    items: [
      { keys: ['Ctrl', 'B'], desc: 'Toggle history / sidebar' },
      { keys: ['Ctrl', ','], desc: 'Open settings' },
      { keys: ['?'], desc: 'Toggle shortcuts' },
      { keys: ['Ctrl', '/'], desc: 'Toggle shortcuts' },
      { keys: ['Ctrl', 'Shift', 'D'], desc: 'Toggle dark mode' },
      { keys: ['Escape'], desc: 'Close any open panel' },
    ],
  },
  {
    group: 'Enhancement levels',
    items: [
      { keys: ['Alt', '1'], desc: 'Level → Basic' },
      { keys: ['Alt', '2'], desc: 'Level → Detailed' },
      { keys: ['Alt', '3'], desc: 'Level → Advanced' },
      { keys: ['Alt', '4'], desc: 'Level → Chain of Thought' },
      { keys: ['Alt', '5'], desc: 'Level → Meta' },
    ],
  },
]


// ─── Component ────────────────────────────────────────────────────────────────


export default function ShortcutsModal({ onClose = () => { } }) {
  const dialogRef = useRef(null)
  const titleRef = useRef(null)


  // Focus trap + Escape handler
  useEffect(() => {
    if (import.meta.env.DEV) console.debug('[ShortcutsModal] Opened')

    titleRef.current?.focus()

    const dialog = dialogRef.current
    if (!dialog) return

    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ')

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (import.meta.env.DEV) console.debug('[ShortcutsModal] Closed via Escape')
        onClose()
        return
      }

      if (e.key !== 'Tab') return

      const focusable = Array.from(dialog.querySelectorAll(focusableSelectors))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }

    dialog.addEventListener('keydown', handleKeyDown)
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown)
      if (import.meta.env.DEV) console.debug('[ShortcutsModal] Unmounted')
    }
  }, [onClose])


  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) {
      if (import.meta.env.DEV) console.debug('[ShortcutsModal] Closed via backdrop')
      onClose()
    }
  }


  return (
    <div
      ref={dialogRef}
      className="shortcuts-overlay animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
    >
      <div className="shortcuts-modal glass-card">

        {/* Header */}
        <div className="shortcuts-header">
          <h2
            id="shortcuts-modal-title"
            className="shortcuts-title"
            tabIndex="-1"
            ref={titleRef}
          >
            Keyboard Shortcuts
          </h2>
          <button
            className="btn-icon"
            aria-label="Close shortcuts"
            onClick={() => {
              if (import.meta.env.DEV) console.debug('[ShortcutsModal] Closed via button')
              onClose()
            }}
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Grouped shortcut list */}
        <div className="shortcuts-body">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.group} className="shortcut-group">

              <p className="shortcut-group-label">{group.group}</p>

              <ul className="shortcuts-list">
                {group.items.map((s) => (
                  <li key={s.keys.join('+')} className="shortcut-row">
                    <div className="shortcut-keys">
                      {s.keys.map((k, j) => (
                        <span key={k} className="shortcut-key-chip">
                          <kbd className="shortcut-kbd">{k}</kbd>
                          {j < s.keys.length - 1 && (
                            <span className="shortcut-plus" aria-hidden="true">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                    <span className="shortcut-desc">{s.desc}</span>
                  </li>
                ))}
              </ul>

            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
