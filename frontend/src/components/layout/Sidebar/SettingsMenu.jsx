import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { GearIcon } from '../../ui/icons'
import SettingsPanel from '../../modals/SettingsModal'
import { useSidebar } from './Sidebar'
import ErrorBoundary from '../../ui/ErrorBoundary'
import './SettingsMenu.css'

export default function SettingsMenu({ settings, onShowShortcuts }) {
  const [isOpen, setIsOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, bottom: 'auto' })
  const triggerRef = useRef(null)
  const popoverRef = useRef(null)
  const { isCollapsed } = useSidebar()

  const toggleMenu = useCallback(() => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const vh = window.innerHeight
      
      let left = rect.right + 12
      let bottom = vh - rect.bottom
      let top = 'auto'

      setPos({ top, left, bottom })
    }
    setIsOpen(prev => !prev)
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleOutside = (e) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [isOpen])

  // Trap Focus and Escape
  useEffect(() => {
    if (!isOpen) return
    const popover = popoverRef.current
    if (!popover) return

    const focusableSelectors = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const focusables = Array.from(popover.querySelectorAll(focusableSelectors))
    if (focusables.length > 0) focusables[0].focus()

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setIsOpen(false)
        triggerRef.current?.focus()
        return
      }
      if (e.key === 'Tab') {
        const els = Array.from(popover.querySelectorAll(focusableSelectors))
        if (!els.length) return
        const first = els[0]
        const last = els[els.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      triggerRef.current?.focus()
    }
  }, [isOpen])

  // Global shortcut to toggle Settings Menu (MOVED OUTSIDE)
  useEffect(() => {
    const handleShortcut = (e) => {
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault()
        toggleMenu()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [toggleMenu])

  return (
    <div className="settings-menu-wrapper">
      <button
        ref={triggerRef}
        onClick={toggleMenu}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Settings"
        title={isCollapsed ? "Settings" : undefined}
        className={`settings-trigger-btn ${isOpen ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`}
      >
        <span className="settings-trigger-icon">
          <GearIcon className="w-5 h-5" />
        </span>
        {!isCollapsed && <span className="settings-trigger-label">Settings</span>}
      </button>

      {isOpen && createPortal(
        <div
          ref={popoverRef}
          role="dialog"
          aria-modal="true"
          aria-label="Settings Context Menu"
          className="settings-popover glass-card gradient-border animate-fade-in"
          style={{
            top: pos.top !== 'auto' ? `${pos.top}px` : 'auto',
            bottom: pos.bottom !== 'auto' ? `${pos.bottom}px` : 'auto',
            left: `${pos.left}px`
          }}
        >
          <ErrorBoundary fallback={<div className="p-5 text-red-400 font-semibold bg-red-500/10">Settings unavailable</div>}>
            <SettingsPanel
              settings={settings}
              onClose={() => {
                setIsOpen(false)
                triggerRef.current?.focus()
              }}
              onShowShortcuts={() => { 
                setIsOpen(false)
                onShowShortcuts?.() 
              }}
            />
          </ErrorBoundary>
        </div>,
        document.body
      )}
    </div>
  )
}