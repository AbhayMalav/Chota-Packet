import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import HistoryItem from './HistoryItem'


describe('HistoryItem', () => {
  const mockItem = { input: 'Write a haiku about AI', ts: Date.now() - 60000 }
  const mockOnSelect = vi.fn()
  const mockOnPin = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
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
})
