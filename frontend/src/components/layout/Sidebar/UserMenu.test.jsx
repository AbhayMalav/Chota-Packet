import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import UserButton from './UserButton'
import { useUser } from '../../../context/UserContext'
import { useSidebar, useSettingsMenu } from './Sidebar'
import { useTheme } from '../../../context/ThemeContext'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../../context/UserContext')
vi.mock('./Sidebar', () => ({
  useSidebar: vi.fn(() => false),
  useSettingsMenu: vi.fn(() => ({
    settingsOpen: false,
    toggleSettings: vi.fn(),
    closeSettings: vi.fn(),
    shortcutsOpen: false,
    openShortcuts: vi.fn(),
    closeShortcuts: vi.fn(),
  })),
}))
vi.mock('../../../context/ThemeContext', () => ({
  useTheme: vi.fn(() => ({
    mode: 'dark',
    setMode: vi.fn(),
    themeColor: 'brand',
    setThemeColor: vi.fn(),
  })),
}))

vi.mock('../../../hooks/usePopoverPosition', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    position: { top: 'auto', bottom: 100, left: 50, right: 'auto' },
    recalculate: vi.fn(),
  })),
}))

describe('UserMenu', () => {
  const mockSetUser = vi.fn()

  beforeEach(() => {
    vi.mocked(useSidebar).mockReturnValue(false)
    vi.mocked(useUser).mockReturnValue([
      { name: 'Test User', email: 'test@example.com', avatar: null },
      mockSetUser
    ])
    vi.mocked(useSettingsMenu).mockReturnValue({
      settingsOpen: false,
      toggleSettings: vi.fn(),
      closeSettings: vi.fn(),
      shortcutsOpen: false,
      openShortcuts: vi.fn(),
      closeShortcuts: vi.fn(),
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    cleanup()
  })

  const openMenu = () => {
    const { container } = render(<UserButton />)
    const btn = screen.getByRole('button', { name: /user menu/i })
    fireEvent.click(btn)
    vi.runAllTimers()
    return { btn, container }
  }

  it('Renders all 9 menu items', () => {
    openMenu()
    const items = screen.getAllByRole('menuitem')
    expect(items).toHaveLength(9)
    const expectedLabels = [
      'Account', 'Preferences', 'Shortcuts', 'Usage & Credits', 
      'All Settings', 'Appearance', 'Language', 'Help', 'Sign Out'
    ]
    expectedLabels.forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument()
    })
  })

  it('Renders profile card with name and email', () => {
    openMenu()
    const profileName = document.body.querySelector('.user-menu-profile-name')
    const profileEmail = document.body.querySelector('.user-menu-profile-email')
    expect(profileName).toHaveTextContent('Test User')
    expect(profileEmail).toHaveTextContent('test@example.com')
  })

  it('Profile card shows initials when avatar is null', () => {
    openMenu()
    const avatarContainer = screen.getByTestId('profile-avatar')
    expect(avatarContainer).toHaveTextContent('TU')
  })

  it('Clicking each stub item triggers a toast (except Appearance, Shortcuts, and All Settings)', async () => {
    openMenu()
    const stubs = ['Account', 'Preferences', 'Usage & Credits', 'Language', 'Help']
    for (const label of stubs) {
      const item = screen.getByText(label)
      fireEvent.click(item)
      expect(screen.getByRole('alert')).toHaveTextContent(`${label} coming soon`)
      
      // Advance to clear toast
      vi.runAllTimers()
      
      // Re-open menu
      const btn = screen.getByRole('button', { name: /user menu/i })
      fireEvent.click(btn)
    }
  })

  it('Appearance item opens the Appearance sub-panel', () => {
    openMenu()
    const appearanceBtn = screen.getByText('Appearance')
    fireEvent.click(appearanceBtn)
    
    // Check that we see sub-panel elements
    expect(screen.getByText('Mode')).toBeInTheDocument()
    expect(screen.getByText('Theme Color')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back to menu/i })).toBeInTheDocument()
  })

  it('Sign Out shows "not signed in" toast', () => {
    openMenu()
    fireEvent.click(screen.getByText('Sign Out'))
    expect(screen.getByRole('alert')).toHaveTextContent('You are not signed in')
  })

  it('Escape closes the menu when on main panel', () => {
    openMenu()
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('Outside click closes the menu', () => {
    openMenu()
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('Arrow Down moves focus to next item', () => {
    openMenu()
    const items = screen.getAllByRole('menuitem')
    expect(items[0]).toHaveFocus()
    
    fireEvent.keyDown(document, { key: 'ArrowDown', code: 'ArrowDown' })
    expect(items[1]).toHaveFocus()
  })

  it('Arrow Down wraps from last to first', () => {
    openMenu()
    const items = screen.getAllByRole('menuitem')
    items[8].focus()
    expect(items[8]).toHaveFocus()
    
    fireEvent.keyDown(document, { key: 'ArrowDown', code: 'ArrowDown' })
    expect(items[0]).toHaveFocus()
  })

  it('Arrow Up wraps from first to last', () => {
    openMenu()
    const items = screen.getAllByRole('menuitem')
    expect(items[0]).toHaveFocus()
    
    fireEvent.keyDown(document, { key: 'ArrowUp', code: 'ArrowUp' })
    expect(items[8]).toHaveFocus()
  })

  it('Focus returns to user button on close', () => {
    const { btn } = openMenu()
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(btn).toHaveFocus()
  })

  it('"All Settings" item is no longer a stub — it calls toggleSettings', () => {
    const mockToggleSettings = vi.fn()
    vi.mocked(useSettingsMenu).mockReturnValue({
      settingsOpen: false,
      toggleSettings: mockToggleSettings,
      closeSettings: vi.fn(),
      shortcutsOpen: false,
      openShortcuts: vi.fn(),
      closeShortcuts: vi.fn(),
    })
    openMenu()
    const allSettingsBtn = screen.getByText('All Settings')
    fireEvent.click(allSettingsBtn)
    expect(mockToggleSettings).toHaveBeenCalled()
  })

  it('"All Settings" click closes the user menu', () => {
    openMenu()
    expect(screen.getByRole('menu')).toBeInTheDocument()
    const allSettingsBtn = screen.getByText('All Settings')
    fireEvent.click(allSettingsBtn)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('Still positions correctly after refactor to usePopoverPosition', () => {
    openMenu()
    const menu = screen.getByRole('menu')
    expect(menu).toBeInTheDocument()
    expect(menu.style.position).toBe('fixed')
  })

  it('"Shortcuts" item opens ShortcutsPanel (no longer a stub toast)', () => {
    openMenu()
    const shortcutsBtn = screen.getByText('Shortcuts')
    fireEvent.click(shortcutsBtn)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: /keyboard shortcuts/i })).toBeInTheDocument()
  })

  it('ShortcutsPanel back button returns to user menu list', () => {
    openMenu()
    fireEvent.click(screen.getByText('Shortcuts'))
    expect(screen.getByRole('dialog', { name: /keyboard shortcuts/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /back to menu/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /keyboard shortcuts/i })).not.toBeInTheDocument()
  })
})
