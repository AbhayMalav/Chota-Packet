import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import HistorySearch from './HistorySearch'


describe('HistorySearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders with placeholder and aria-label', () => {
    render(<HistorySearch />)
    const input = screen.getByRole('textbox', { name: 'Search history' })
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('placeholder', 'Search prompts...')
  })

  it('clear button hidden when input is empty', () => {
    render(<HistorySearch />)
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
  })

  it('clear button visible when input has value', () => {
    render(<HistorySearch value="test" />)
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument()
  })

  it('clear button click resets input and calls onClear', () => {
    const onClear = vi.fn()
    const onChange = vi.fn()
    render(<HistorySearch value="test" onChange={onChange} onClear={onClear} />)

    const clearBtn = screen.getByRole('button', { name: 'Clear search' })
    fireEvent.click(clearBtn)

    expect(onClear).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
  })

  it('onChange is debounced (vi.useFakeTimers)', () => {
    const onChange = vi.fn()
    render(<HistorySearch onChange={onChange} />)

    const input = screen.getByRole('textbox', { name: 'Search history' })
    fireEvent.change(input, { target: { value: 'hello' } })

    expect(onChange).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(onChange).toHaveBeenCalledWith('hello')
  })

  it('debounce cleans up on unmount', () => {
    const onChange = vi.fn()
    const { unmount } = render(<HistorySearch onChange={onChange} />)

    const input = screen.getByRole('textbox', { name: 'Search history' })
    fireEvent.change(input, { target: { value: 'test' } })

    unmount()

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(onChange).not.toHaveBeenCalled()
  })
})
