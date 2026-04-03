import React, { useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { GearIcon } from '../../ui/icons'
import SettingsPanel from '../../modals/SettingsModal'
import { useSidebar, useSettingsMenu } from './Sidebar'
import usePopoverPosition from '../../../hooks/usePopoverPosition'
import ErrorBoundary from '../../ui/ErrorBoundary'
import './SettingsMenu.css'

export default function SettingsMenu({ settings, onShowShortcuts }) {
  const triggerRef = useRef(null)
  const popoverRef = useRef(null)
  const isCollapsed = useSidebar()
  const { settingsOpen, toggleSettings, closeSettings } = useSettingsMenu()
  const { position } = usePopoverPosition(triggerRef, popoverRef, { estimatedWidth: 360 })

  const handleToggle = useCallback(() => {
    toggleSettings()
  }, [toggleSettings])

  const handleClose = useCallback(() => {
    closeSettings()
    triggerRef.current?.focus()
  }, [closeSettings])

  // Close on outside click
  useEffect(() => {
    if (!settingsOpen) return
    const handleOutside = (e) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        handleClose()
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [settingsOpen, handleClose])

  // Trap Focus and Escape
  useEffect(() => {
    if (!settingsOpen) return
    const popover = popoverRef.current
    if (!popover) return

    const focusableSelectors = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const focusables = Array.from(popover.querySelectorAll(focusableSelectors))
    if (focusables.length > 0) focusables[0].focus()

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
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
    }
  }, [settingsOpen, handleClose])

  // Global shortcut to toggle Settings Menu
  useEffect(() => {
    const handleShortcut = (e) => {
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault()
        handleToggle()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [handleToggle])

  return (
    <div className="settings-menu-wrapper">
      <button
        ref={triggerRef}
        onClick={handleToggle}
        aria-haspopup="dialog"
        aria-expanded={settingsOpen}
        aria-label="Settings"
        title={isCollapsed ? "Settings" : undefined}
        className={`settings-trigger-btn ${settingsOpen ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`}
      >
        <span className="settings-trigger-icon">
          <GearIcon className="w-5 h-5" />
        </span>
        {!isCollapsed && <span className="settings-trigger-label">Settings</span>}
      </button>

      {settingsOpen && createPortal(
        <div
          ref={popoverRef}
          role="dialog"
          aria-modal="true"
          aria-label="Settings Context Menu"
          className="settings-popover glass-card gradient-border animate-fade-in"
          style={{
            position: 'fixed',
            top: position.top,
            bottom: position.bottom,
            left: position.left,
            right: position.right,
            zIndex: 100,
          }}
        >
          <ErrorBoundary fallback={<div className="p-5 text-red-400 font-semibold bg-red-500/10">Settings unavailable</div>}>
            <SettingsPanel
              settings={settings}
              onClose={handleClose}
              onShowShortcuts={() => {
                handleClose()
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
