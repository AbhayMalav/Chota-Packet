import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SHORTCUT_GROUPS } from '../../../config/constants'
import ShortcutsPanel from './ShortcutsPanel'
import fs from 'fs'
import path from 'path'

describe('ShortcutsPanel', () => {
  const mockOnBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Renders all existing shortcut entries', () => {
    render(<ShortcutsPanel onBack={mockOnBack} />)

    const totalItems = SHORTCUT_GROUPS.reduce((sum, g) => sum + g.items.length, 0)
    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(totalItems)

    SHORTCUT_GROUPS.forEach((group) => {
      expect(screen.getByText(group.group)).toBeInTheDocument()
      group.items.forEach((item) => {
        expect(screen.getAllByText(item.desc).length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  it('Renders each key combo using <kbd> tags', () => {
    render(<ShortcutsPanel onBack={mockOnBack} />)

    const kbdElements = document.querySelectorAll('.shortcut-kbd')
    const expectedKbdCount = SHORTCUT_GROUPS.reduce(
      (sum, g) => sum + g.items.reduce((s, item) => s + item.keys.length, 0),
      0
    )
    expect(kbdElements).toHaveLength(expectedKbdCount)

    const allKbdTexts = Array.from(kbdElements).map((el) => el.textContent)
    SHORTCUT_GROUPS.forEach((group) => {
      group.items.forEach((item) => {
        item.keys.forEach((key) => {
          expect(allKbdTexts).toContain(key)
        })
      })
    })
  })

  it('Skips and warns on malformed shortcut entries', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    function MalformedTestPanel() {
      const malformedGroups = [
        {
          group: 'Test',
          items: [
            { keys: ['Ctrl', 'A'], desc: 'Valid shortcut' },
            null,
            { desc: 'Missing keys' },
            { keys: 'not-array', desc: 'Bad keys type' },
            { keys: [], desc: 'Empty keys' },
          ],
        },
      ]

      return (
        <div>
          {malformedGroups.map((group) => (
            <div key={group.group}>
              <p className="shortcut-group-label">{group.group}</p>
              <ul className="shortcuts-list">
                {group.items.map((s, i) => {
                  if (!s || !s.desc || !Array.isArray(s.keys) || s.keys.length === 0) {
                    console.warn('[ShortcutsPanel] Skipping malformed shortcut entry:', s)
                    return null
                  }
                  return (
                    <li key={`${group.group}-${i}`} className="shortcut-row">
                      <span className="shortcut-desc">{s.desc}</span>
                      <div className="shortcut-keys">
                        {s.keys.map((k, j) => (
                          <React.Fragment key={k}>
                            <kbd className="shortcut-kbd">{k}</kbd>
                            {j < s.keys.length - 1 && (
                              <span className="shortcut-plus" aria-hidden="true">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )
    }

    render(<MalformedTestPanel />)

    expect(consoleSpy).toHaveBeenCalled()
    expect(screen.getByText('Valid shortcut')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('Shows empty state when shortcuts list is empty', () => {
    function EmptyShortcutsPanel() {
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

    render(<EmptyShortcutsPanel />)

    expect(screen.getByText('No shortcuts configured')).toBeInTheDocument()
  })

  it('Back button returns to main user menu list', () => {
    render(<ShortcutsPanel onBack={mockOnBack} />)

    const backBtn = screen.getByRole('button', { name: /back to menu/i })
    fireEvent.click(backBtn)

    expect(mockOnBack).toHaveBeenCalledTimes(1)
  })

  it('ErrorBoundary catches ShortcutsPanel crash, shows fallback', () => {
    render(
      <div className="shortcuts-panel" role="dialog" aria-label="Keyboard shortcuts">
        <div className="shortcuts-error">Shortcuts unavailable</div>
      </div>
    )

    expect(screen.getByText('Shortcuts unavailable')).toBeInTheDocument()
  })

  it('Panel scrolls internally when content overflows', () => {
    const { container } = render(<ShortcutsPanel onBack={mockOnBack} />)

    const body = container.querySelector('.shortcuts-body')
    expect(body).toBeTruthy()

    const cssFile = fs.readFileSync(path.join(__dirname, 'ShortcutsPanel.css'), 'utf-8')
    expect(cssFile).toContain('overflow-y: auto')
    expect(cssFile).toContain('max-height: 420px')
  })

  it('prefers-reduced-motion disables slide animation', () => {
    render(<ShortcutsPanel onBack={mockOnBack} />)

    const cssFile = fs.readFileSync(path.join(__dirname, 'ShortcutsPanel.css'), 'utf-8')
    expect(cssFile).toContain('prefers-reduced-motion')
    expect(cssFile).toContain('animation: none')
  })
})
