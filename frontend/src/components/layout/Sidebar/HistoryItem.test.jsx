import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import HistoryItem from './HistoryItem'
import * as exportService from '../../../services/exportService'
import * as usePopoverPosition from '../../../hooks/usePopoverPosition'


vi.mock('../../../services/exportService', () => ({
  exportSingleItem: vi.fn(),
}))

vi.mock('../../../hooks/usePopoverPosition', () => ({
  usePopoverPosition: vi.fn(() => ({ position: { top: 100, left: 200 } })),
}))


describe('HistoryItem', () => {
  let mockItem
  const mockOnSelect = vi.fn()
  const mockOnPin = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
    mockItem = { input: 'Write a haiku about AI', ts: Date.now() - 60000 }
    mockOnSelect.mockClear()
    mockOnPin.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders truncated prompt text', () => {
    render(
      <HistoryItem
        item={mockItem}
        onSelect={mockOnSelect}
        onPin={mockOnPin}
      />
    )
    expect(screen.getByText('Write a haiku about AI')).toBeInTheDocument()
  })

  it('shows pin icon on hover only (unpinned state)', () => {
    render(
      <HistoryItem
        item={mockItem}
        onSelect={mockOnSelect}
        onPin={mockOnPin}
      />
    )
    const btn = screen.getByRole('button', { name: /Load/ })
    expect(screen.queryByRole('button', { name: 'Pin prompt' })).not.toBeInTheDocument()

    fireEvent.mouseEnter(btn)
    expect(screen.getByRole('button', { name: 'Pin prompt' })).toBeInTheDocument()

    fireEvent.mouseLeave(btn)
    expect(screen.queryByRole('button', { name: 'Pin prompt' })).not.toBeInTheDocument()
  })

  it('shows filled pin icon when pinned', () => {
    render(
      <HistoryItem
        item={mockItem}
        isPinned
        onSelect={mockOnSelect}
        onPin={mockOnPin}
      />
    )
    expect(screen.getByRole('button', { name: 'Unpin prompt' })).toBeInTheDocument()
  })

  it('click on pin icon calls onPin handler', () => {
    render(
      <HistoryItem
        item={mockItem}
        isPinned
        onSelect={mockOnSelect}
        onPin={mockOnPin}
      />
    )
    const pinBtn = screen.getByRole('button', { name: 'Unpin prompt' })
    fireEvent.click(pinBtn)
    expect(mockOnPin).toHaveBeenCalledTimes(1)
    expect(mockOnSelect).not.toHaveBeenCalled()
  })

  it('aria-label updates based on pin state', () => {
    const { rerender } = render(
      <HistoryItem
        item={mockItem}
        isPinned={false}
        onSelect={mockOnSelect}
        onPin={mockOnPin}
      />
    )

    const btn = screen.getByRole('button', { name: /Load/ })
    fireEvent.mouseEnter(btn)
    expect(screen.getByRole('button', { name: 'Pin prompt' })).toBeInTheDocument()

    rerender(
      <HistoryItem
        item={mockItem}
        isPinned
        onSelect={mockOnSelect}
        onPin={mockOnPin}
      />
    )
    expect(screen.getByRole('button', { name: 'Unpin prompt' })).toBeInTheDocument()
  })

  it('skips and warns when item has no id', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const itemWithoutId = { input: 'No id item' }
    render(
      <HistoryItem
        item={itemWithoutId}
        onSelect={mockOnSelect}
        onPin={mockOnPin}
      />
    )

    const btn = screen.getByRole('button', { name: /Load/ })
    fireEvent.mouseEnter(btn)
    const pinBtn = screen.getByRole('button', { name: 'Pin prompt' })
    fireEvent.click(pinBtn)

    expect(console.warn).toHaveBeenCalledWith(
      '[HistoryItem] Cannot pin item without id:',
      itemWithoutId
    )
    expect(mockOnPin).not.toHaveBeenCalled()

    console.warn.mockRestore()
  })

  // ── Export ───────────────────────────────────────────────────────────────────

  it('Export icon visible on hover', () => {
    render(
      <HistoryItem
        item={mockItem}
        onSelect={mockOnSelect}
        onPin={mockOnPin}
      />
    )
    const btn = screen.getByRole('button', { name: /Load/ })
    expect(screen.queryByRole('button', { name: 'Export this prompt' })).not.toBeInTheDocument()

    fireEvent.mouseEnter(btn)
    expect(screen.getByRole('button', { name: 'Export this prompt' })).toBeInTheDocument()

    fireEvent.mouseLeave(btn)
    expect(screen.queryByRole('button', { name: 'Export this prompt' })).not.toBeInTheDocument()
  })

  it('Export icon has correct aria-label', () => {
    render(
      <HistoryItem
        item={mockItem}
        onSelect={mockOnSelect}
        onPin={mockOnPin}
      />
    )
    const btn = screen.getByRole('button', { name: /Load/ })
    fireEvent.mouseEnter(btn)
    expect(screen.getByRole('button', { name: 'Export this prompt' })).toBeInTheDocument()
  })

  it('Export icon click opens HistoryExportMenu', () => {
    const mockExportSingleItem = vi.mocked(exportService.exportSingleItem)
    mockExportSingleItem.mockImplementation(() => {})

    render(
      <HistoryItem
        item={mockItem}
        onSelect={mockOnSelect}
        onPin={mockOnPin}
      />
    )

    const itemBtn = screen.getByRole('button', { name: /Load/ })
    fireEvent.mouseEnter(itemBtn)

    const exportBtn = screen.getByRole('button', { name: 'Export this prompt' })
    fireEvent.click(exportBtn)

    expect(screen.getByText('Markdown')).toBeInTheDocument()
    expect(screen.getByText('Plain Text')).toBeInTheDocument()
    expect(screen.getByText('JSON')).toBeInTheDocument()
  })

  it('usePopoverPosition is used (spy check)', () => {
    const spyUsePopoverPosition = vi.spyOn(usePopoverPosition, 'usePopoverPosition')

    render(
      <HistoryItem
        item={mockItem}
        onSelect={mockOnSelect}
        onPin={mockOnPin}
      />
    )

    expect(spyUsePopoverPosition).toHaveBeenCalled()
  })
})
