import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest'
import AppearancePanel from './AppearancePanel'

// ── Mock ThemeContext ─────────────────────────────────────────────────────────
const mockSetMode = vi.fn()
const mockSetThemeColor = vi.fn()

let mockMode = 'system'
let mockThemeColor = 'brand'

vi.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    mode: mockMode,
    setMode: mockSetMode,
    themeColor: mockThemeColor,
    setThemeColor: mockSetThemeColor,
  }),
  default: ({ children }) => <>{children}</>,
}))

// Mock window.matchMedia for SSR/test env
const mockMatchMedia = (matches) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('AppearancePanel', () => {
  const onBack = vi.fn()

  beforeEach(() => {
    mockMode = 'system'
    mockThemeColor = 'brand'
    mockMatchMedia(false) // default: prefers light
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('Renders 3 theme options: Light, Dark, System', () => {
    render(<AppearancePanel onBack={onBack} />)
    expect(screen.getByRole('radio', { name: /light mode/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /dark mode/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /system mode/i })).toBeInTheDocument()
  })

  it('Currently active theme shows aria-checked=true', () => {
    mockMode = 'dark'
    render(<AppearancePanel onBack={onBack} />)
    expect(screen.getByRole('radio', { name: /dark mode/i })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: /light mode/i })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('radio', { name: /system mode/i })).toHaveAttribute('aria-checked', 'false')
  })

  it('Clicking Dark calls setMode("dark")', () => {
    render(<AppearancePanel onBack={onBack} />)
    fireEvent.click(screen.getByRole('radio', { name: /dark mode/i }))
    expect(mockSetMode).toHaveBeenCalledWith('dark')
  })

  it('Clicking Light calls setMode("light")', () => {
    render(<AppearancePanel onBack={onBack} />)
    fireEvent.click(screen.getByRole('radio', { name: /light mode/i }))
    expect(mockSetMode).toHaveBeenCalledWith('light')
  })

  it('Clicking System calls setMode("system")', () => {
    render(<AppearancePanel onBack={onBack} />)
    fireEvent.click(screen.getByRole('radio', { name: /system mode/i }))
    expect(mockSetMode).toHaveBeenCalledWith('system')
  })

  it('Theme change does not close the user menu (onBack not called on mode change)', () => {
    render(<AppearancePanel onBack={onBack} />)
    fireEvent.click(screen.getByRole('radio', { name: /dark mode/i }))
    expect(onBack).not.toHaveBeenCalled()
  })

  it('Back button calls onBack', () => {
    render(<AppearancePanel onBack={onBack} />)
    fireEvent.click(screen.getByRole('button', { name: /back to menu/i }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('Does not throw when matchMedia is unavailable', () => {
    // Remove matchMedia to simulate SSR/test environment
    const original = window.matchMedia
    delete window.matchMedia

    // ThemeContext handles the fallback — we test that it doesn't throw
    expect(() => render(<AppearancePanel onBack={onBack} />)).not.toThrow()

    window.matchMedia = original
  })

  it('Renders with mocked default theme values', () => {
    // Our mock already provides defaults — just ensure no crash
    render(<AppearancePanel onBack={onBack} />)
    expect(screen.getByRole('radio', { name: /system mode/i })).toBeInTheDocument()
  })

  // ── Accessibility tests ───────────────────────────────────────────────────

  it('Only the active mode radio button has tabIndex="0"', () => {
    mockMode = 'dark'
    render(<AppearancePanel onBack={onBack} />)
    expect(screen.getByRole('radio', { name: /dark mode/i })).toHaveAttribute('tabIndex', '0')
    expect(screen.getByRole('radio', { name: /light mode/i })).toHaveAttribute('tabIndex', '-1')
    expect(screen.getByRole('radio', { name: /system mode/i })).toHaveAttribute('tabIndex', '-1')
  })

  it('ArrowRight on Mode radio moves selection and focuses next item', () => {
    vi.useFakeTimers()
    mockMode = 'light' // index 0: Light
    render(<AppearancePanel onBack={onBack} />)
    const lightBtn = screen.getByRole('radio', { name: /light mode/i })
    const darkBtn = screen.getByRole('radio', { name: /dark mode/i })
    
    lightBtn.focus()
    fireEvent.keyDown(lightBtn, { key: 'ArrowRight' })
    
    expect(mockSetMode).toHaveBeenCalledWith('dark')
    
    // In jsdom + react, focus move happens after a re-render or timeout
    vi.runAllTimers()
    expect(darkBtn).toHaveFocus()
    vi.useRealTimers()
  })

  it('ArrowUp on Mode radio wraps to last item', () => {
    vi.useFakeTimers()
    mockMode = 'light' // index 0: Light
    render(<AppearancePanel onBack={onBack} />)
    const lightBtn = screen.getByRole('radio', { name: /light mode/i })
    const systemBtn = screen.getByRole('radio', { name: /system mode/i })
    
    lightBtn.focus()
    fireEvent.keyDown(lightBtn, { key: 'ArrowUp' })
    
    expect(mockSetMode).toHaveBeenCalledWith('system')
    
    vi.runAllTimers()
    expect(systemBtn).toHaveFocus()
    vi.useRealTimers()
  })

  it('Only the active color radio button has tabIndex="0"', () => {
    mockThemeColor = 'orange'
    render(<AppearancePanel onBack={onBack} />)
    expect(screen.getByRole('radio', { name: /orange/i })).toHaveAttribute('tabIndex', '0')
    expect(screen.getByRole('radio', { name: /default/i })).toHaveAttribute('tabIndex', '-1')
  })

  it('ArrowDown on Color radio moves selection and focuses next item', () => {
    vi.useFakeTimers()
    mockThemeColor = 'brand' // first item
    render(<AppearancePanel onBack={onBack} />)
    const brandBtn = screen.getByRole('radio', { name: /default/i })
    const orangeBtn = screen.getByRole('radio', { name: /orange/i })
    
    brandBtn.focus()
    fireEvent.keyDown(brandBtn, { key: 'ArrowDown' })
    
    expect(mockSetThemeColor).toHaveBeenCalledWith('orange')
    
    vi.runAllTimers()
    expect(orangeBtn).toHaveFocus()
    vi.useRealTimers()
  })
})
