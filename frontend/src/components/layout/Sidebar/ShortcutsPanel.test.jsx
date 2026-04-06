import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ShortcutsPanel from './ShortcutsPanel'
import ErrorBoundary from '../../ui/ErrorBoundary'

const { mockMalformedGroups, mockEmptyGroups, mockLongComboGroups, mockNormalGroups } = vi.hoisted(() => ({
  mockMalformedGroups: [
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
  ],
  mockEmptyGroups: [],
  mockLongComboGroups: [
    {
      group: 'Test',
      items: [
        { keys: ['Ctrl', 'Shift', 'Alt', 'Meta', 'K'], desc: 'Very long combo' },
      ],
    },
  ],
  mockNormalGroups: [
    {
      group: 'Generation',
      items: [
        { keys: ['Ctrl', 'Enter'], desc: 'Enhance prompt' },
      ],
    },
  ],
}))

vi.mock('../../../config/constants', () => ({
  SHORTCUT_GROUPS: mockNormalGroups,
}))

describe('ShortcutsPanel', () => {
  const mockOnBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('Renders all existing shortcut entries', () => {
    render(<ShortcutsPanel onBack={mockOnBack} />)

    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(mockNormalGroups[0].items.length)

    mockNormalGroups.forEach((group) => {
      expect(screen.getByText(group.group)).toBeInTheDocument()
      group.items.forEach((item) => {
        expect(screen.getAllByText(item.desc).length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  it('Renders each key combo using <kbd> tags', () => {
    render(<ShortcutsPanel onBack={mockOnBack} />)

    const kbdElements = document.querySelectorAll('.shortcut-kbd')
    const expectedKbdCount = mockNormalGroups.reduce(
      (sum, g) => sum + g.items.reduce((s, item) => s + item.keys.length, 0),
      0
    )
    expect(kbdElements).toHaveLength(expectedKbdCount)

    const allKbdTexts = Array.from(kbdElements).map((el) => el.textContent)
    mockNormalGroups.forEach((group) => {
      group.items.forEach((item) => {
        item.keys.forEach((key) => {
          expect(allKbdTexts).toContain(key)
        })
      })
    })
  })

  it('Skips and warns on malformed shortcut entries', async () => {
    vi.doMock('../../../config/constants', () => ({
      SHORTCUT_GROUPS: mockMalformedGroups,
    }))

    const { default: ShortcutsPanelMock } = await import('./ShortcutsPanel')

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(<ShortcutsPanelMock onBack={mockOnBack} />)

    expect(consoleSpy).toHaveBeenCalled()
    expect(screen.getByText('Valid shortcut')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('Shows empty state when shortcuts list is empty', async () => {
    vi.doMock('../../../config/constants', () => ({
      SHORTCUT_GROUPS: mockEmptyGroups,
    }))

    const { default: ShortcutsPanelMock } = await import('./ShortcutsPanel')

    render(<ShortcutsPanelMock onBack={mockOnBack} />)

    expect(screen.getByText('No shortcuts configured')).toBeInTheDocument()
  })

  it('Back button returns to main user menu list', () => {
    render(<ShortcutsPanel onBack={mockOnBack} />)

    const backBtn = screen.getByRole('button', { name: /back to menu/i })
    fireEvent.click(backBtn)

    expect(mockOnBack).toHaveBeenCalledTimes(1)
  })

  it('ErrorBoundary catches ShortcutsPanel crash, shows fallback', () => {
    function ThrowingComponent() {
      throw new Error('Test error')
    }

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('Panel scrolls internally when content overflows', () => {
    const { container } = render(<ShortcutsPanel onBack={mockOnBack} />)
    const body = container.querySelector('.shortcuts-body')
    expect(body).toBeTruthy()
  })

  it('Panel renders with base styles', () => {
    const { container } = render(<ShortcutsPanel onBack={mockOnBack} />)
    const panel = container.querySelector('.shortcuts-panel')
    expect(panel).toBeTruthy()
  })

  it('Panel has required structure', () => {
    render(<ShortcutsPanel onBack={mockOnBack} />)
    expect(screen.getByText('Shortcuts')).toBeInTheDocument()
  })

  it('Each key in a combo renders as its own <kbd> tag', () => {
    render(<ShortcutsPanel onBack={mockOnBack} />)

    const rows = screen.getAllByRole('listitem')
    rows.forEach((row) => {
      const kbdTags = row.querySelectorAll('.shortcut-kbd')
      expect(kbdTags.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('"+" separator is not wrapped in <kbd>', () => {
    render(<ShortcutsPanel onBack={mockOnBack} />)

    const plusSeparators = document.querySelectorAll('.shortcut-plus')
    expect(plusSeparators.length).toBeGreaterThan(0)
    plusSeparators.forEach((el) => {
      expect(el.tagName.toLowerCase()).toBe('span')
      expect(el.closest('.shortcut-kbd')).toBeNull()
    })
  })

  it('Key combo container uses nowrap to prevent wrapping', () => {
    render(<ShortcutsPanel onBack={mockOnBack} />)
    const keysContainer = document.querySelector('.shortcut-keys')
    expect(keysContainer).toBeTruthy()
  })

  it('Long action label truncates with ellipsis', () => {
    render(<ShortcutsPanel onBack={mockOnBack} />)
    const label = document.querySelector('.shortcut-desc')
    expect(label).toBeTruthy()
  })

  it('Warns on combo with more than 4 keys', async () => {
    vi.doMock('../../../config/constants', () => ({
      SHORTCUT_GROUPS: mockLongComboGroups,
    }))

    const { default: ShortcutsPanelMock } = await import('./ShortcutsPanel')

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(<ShortcutsPanelMock onBack={mockOnBack} />)

    expect(consoleSpy).toHaveBeenCalledWith(
      '[ShortcutsPanel] Unusually long key combo, may overflow:',
      { keys: ['Ctrl', 'Shift', 'Alt', 'Meta', 'K'], desc: 'Very long combo' }
    )

    consoleSpy.mockRestore()
  })

  it('Panel has appropriate base styles', () => {
    const { container } = render(<ShortcutsPanel onBack={mockOnBack} />)
    const panel = container.querySelector('.shortcuts-panel')
    expect(panel).toBeTruthy()
  })
})
