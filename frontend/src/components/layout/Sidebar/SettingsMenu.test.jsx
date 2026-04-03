import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import SettingsMenu from './SettingsMenu'

// Mock dependencies
jest.mock('./Sidebar', () => ({
  useSidebar: () => ({ isCollapsed: false })
}))

jest.mock('../../ui/icons', () => ({
  GearIcon: () => <svg data-testid="gear-icon" />
}))

let mockSettingsPanelThrow = false;
jest.mock('../../Settings/SettingsPanel', () => {
  return function MockSettingsPanel({ onClose }) {
    if (mockSettingsPanelThrow) {
      throw new Error('Test Error')
    }
    return (
      <div data-testid="settings-panel">
        <button onClick={onClose}>Close Inner</button>
      </div>
    )
  }
})

describe('SettingsMenu', () => {
  beforeEach(() => {
    mockSettingsPanelThrow = false;
    // Suppress React error boundary console logs
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    console.error.mockRestore()
  })

  it('Renders closed by default', () => {
    render(<SettingsMenu />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /settings/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('Opens on settings button click and aria-expanded updates correctly', () => {
    render(<SettingsMenu />)
    const trigger = screen.getByRole('button', { name: /settings/i })
    fireEvent.click(trigger)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('Double-click on trigger toggles closed', () => {
    render(<SettingsMenu />)
    const trigger = screen.getByRole('button', { name: /settings/i })
    fireEvent.click(trigger) // open
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(trigger) // close
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Closes on outside click', () => {
    render(<SettingsMenu />)
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Closes on Escape key and focus returns to trigger', () => {
    render(<SettingsMenu />)
    const trigger = screen.getByRole('button', { name: /settings/i })
    fireEvent.click(trigger)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(trigger)
  })

  it('Does not crash when SettingsPanel throws (ErrorBoundary)', () => {
    mockSettingsPanelThrow = true;
    render(<SettingsMenu />)
    fireEvent.click(screen.getByRole('button', { name: /settings/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Settings unavailable')).toBeInTheDocument()
  })
})