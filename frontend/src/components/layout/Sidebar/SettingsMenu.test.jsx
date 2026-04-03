import React, { useState, useCallback, createContext } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const SidebarContext = createContext(false)
const SettingsContext = createContext({
  settingsOpen: false,
  toggleSettings: () => {},
  closeSettings: () => {},
})

vi.mock('./Sidebar', async () => {
  const React = await import('react')
  return {
    useSidebar: () => React.useContext(SidebarContext),
    useSettingsMenu: () => React.useContext(SettingsContext),
  }
})

vi.mock('../../ui/icons', () => ({
  GearIcon: () => <svg data-testid="gear-icon" />,
  XIcon: () => <svg data-testid="x-icon" />,
}))

let mockSettingsPanelThrow = false
vi.mock('../../modals/SettingsModal', () => {
  return {
    default: function MockSettingsPanel({ onClose }) {
      if (mockSettingsPanelThrow) {
        throw new Error('Test Error')
      }
      return (
        <div data-testid="settings-panel">
          <button onClick={onClose}>Close Inner</button>
        </div>
      )
    }
  }
})

vi.mock('../../../hooks/usePopoverPosition', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    position: { top: 252, bottom: 'auto', left: 152, right: 'auto' },
    recalculate: vi.fn(),
  })),
}))

function TestWrapper({ children }) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  const toggleSettings = useCallback(() => {
    if (settingsOpen) {
      console.warn('[SettingsMenu] Already open, ignoring duplicate trigger')
      return
    }
    setSettingsOpen(true)
  }, [settingsOpen])

  const closeSettings = useCallback(() => {
    setSettingsOpen(false)
  }, [])

  return (
    <SidebarContext.Provider value={false}>
      <SettingsContext.Provider value={{ settingsOpen, toggleSettings, closeSettings }}>
        {children}
      </SettingsContext.Provider>
    </SidebarContext.Provider>
  )
}

describe('SettingsMenu', () => {
  let SettingsMenu
  let usePopoverPosition

  beforeEach(async () => {
    mockSettingsPanelThrow = false
    vi.clearAllMocks()
    const mod = await import('./SettingsMenu')
    SettingsMenu = mod.default
    const hookMod = await import('../../../hooks/usePopoverPosition')
    usePopoverPosition = hookMod.default
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    console.error.mockRestore()
    console.warn.mockRestore()
  })

  it('Renders closed by default', () => {
    render(<SettingsMenu />, { wrapper: TestWrapper })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /settings/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('Opens correctly when triggered from sidebar settings icon', () => {
    render(<SettingsMenu />, { wrapper: TestWrapper })
    const trigger = screen.getByRole('button', { name: /settings/i })
    fireEvent.click(trigger)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('Closes on outside click', () => {
    render(<SettingsMenu />, { wrapper: TestWrapper })
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Closes on Escape key', () => {
    render(<SettingsMenu />, { wrapper: TestWrapper })
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Does not crash when SettingsPanel throws (ErrorBoundary)', () => {
    mockSettingsPanelThrow = true
    render(<SettingsMenu />, { wrapper: TestWrapper })
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('Uses usePopoverPosition hook', () => {
    render(<SettingsMenu />, { wrapper: TestWrapper })
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    expect(usePopoverPosition).toHaveBeenCalled()
  })

  it('Panel does not overflow viewport when trigger is at bottom of sidebar', () => {
    usePopoverPosition.mockReturnValue({
      position: { top: 'auto', bottom: 100, left: 152, right: 'auto' },
      recalculate: vi.fn(),
    })

    render(<SettingsMenu />, { wrapper: TestWrapper })
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog.style.bottom).toBe('100px')
    expect(dialog.style.top).toBe('auto')
  })

  it('Panel does not overflow viewport when trigger is near right edge', () => {
    usePopoverPosition.mockReturnValue({
      position: { top: 252, bottom: 'auto', left: 'auto', right: 100 },
      recalculate: vi.fn(),
    })

    render(<SettingsMenu />, { wrapper: TestWrapper })
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog.style.left).toBe('auto')
    expect(dialog.style.right).toBe('100px')
  })
})
