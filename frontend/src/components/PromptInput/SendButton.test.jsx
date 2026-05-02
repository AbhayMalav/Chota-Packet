/* global describe, it, expect, beforeEach, afterEach, vi */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SendButton from './SendButton'

vi.mock('../../hooks/useTranslation', () => ({
  __esModule: true,
  default: vi.fn(() => ({ t: { enhance: 'Enhance' } }))
}))

describe('SendButton', () => {
  it('renders with aria-label="Enhance"', () => {
    render(<SendButton onSubmit={() => {}} />)
    const btn = screen.getByRole('button', { name: 'Enhance' })
    expect(btn).toBeInTheDocument()
    // Check that it has the touch-target class
    expect(btn).toHaveClass('touch-target')
  })

  it('is disabled when input is empty', () => {
    render(<SendButton onSubmit={() => {}} disabled />)
    const btn = screen.getByRole('button', { name: 'Enhance' })
    expect(btn).toBeDisabled()
  })

  it('is disabled when input is whitespace only', () => {
    render(<SendButton onSubmit={() => {}} disabled />)
    const btn = screen.getByRole('button', { name: 'Enhance' })
    expect(btn).toBeDisabled()
  })

  it('is disabled when enhancement is in progress', () => {
    render(<SendButton onSubmit={() => {}} isLoading />)
    const btn = screen.getByRole('button', { name: 'Enhance' })
    expect(btn).toBeDisabled()
  })

  it('shows spinner when in progress', () => {
    render(<SendButton onSubmit={() => {}} isLoading />)
    const btn = screen.getByRole('button', { name: 'Enhance' })
    const spinner = btn.querySelector('.send-btn__spinner')
    expect(spinner).toBeInTheDocument()
  })

  it('click calls submit handler exactly once', () => {
    const submitFn = vi.fn()
    render(<SendButton onSubmit={submitFn} />)
    const btn = screen.getByRole('button', { name: 'Enhance' })
    fireEvent.click(btn)
    expect(submitFn).toHaveBeenCalledTimes(1)
  })

  it('each click submits once when not loading', () => {
    const submitFn = vi.fn()
    render(<SendButton onSubmit={submitFn} />)
    const btn = screen.getByRole('button', { name: 'Enhance' })
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(submitFn).toHaveBeenCalledTimes(2)
  })

  it('logs error when no handler provided', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<SendButton />)
    const btn = screen.getByRole('button', { name: 'Enhance' })
    fireEvent.click(btn)
    expect(console.error).toHaveBeenCalledWith('[SendButton] No submit handler provided')
    console.error.mockRestore()
  })
})
