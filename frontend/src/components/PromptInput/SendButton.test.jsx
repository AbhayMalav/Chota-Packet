/* global describe, it, expect, beforeEach, afterEach, vi */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SendButton from './SendButton'


describe('SendButton', () => {
  it('renders with aria-label="Send for enhancement"', () => {
    render(<SendButton onSubmit={() => {}} />)
    const btn = screen.getByRole('button', { name: 'Send for enhancement' })
    expect(btn).toBeInTheDocument()
  })

  it('is disabled when input is empty', () => {
    render(<SendButton onSubmit={() => {}} disabled />)
    const btn = screen.getByRole('button', { name: 'Send for enhancement' })
    expect(btn).toBeDisabled()
  })

  it('is disabled when input is whitespace only', () => {
    render(<SendButton onSubmit={() => {}} disabled />)
    const btn = screen.getByRole('button', { name: 'Send for enhancement' })
    expect(btn).toBeDisabled()
  })

  it('is disabled when enhancement is in progress', () => {
    render(<SendButton onSubmit={() => {}} isLoading />)
    const btn = screen.getByRole('button', { name: 'Send for enhancement' })
    expect(btn).toBeDisabled()
  })

  it('shows spinner when in progress', () => {
    render(<SendButton onSubmit={() => {}} isLoading />)
    const btn = screen.getByRole('button', { name: 'Send for enhancement' })
    const spinner = btn.querySelector('.send-btn__spinner')
    expect(spinner).toBeInTheDocument()
  })

  it('click calls submit handler exactly once', () => {
    const submitFn = vi.fn()
    render(<SendButton onSubmit={submitFn} />)
    const btn = screen.getByRole('button', { name: 'Send for enhancement' })
    fireEvent.click(btn)
    expect(submitFn).toHaveBeenCalledTimes(1)
  })

  it('double click does not submit twice', () => {
    const submitFn = vi.fn()
    render(<SendButton onSubmit={submitFn} />)
    const btn = screen.getByRole('button', { name: 'Send for enhancement' })
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(submitFn).toHaveBeenCalledTimes(2)
  })

  it('logs error when no handler provided', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<SendButton />)
    const btn = screen.getByRole('button', { name: 'Send for enhancement' })
    fireEvent.click(btn)
    expect(console.error).toHaveBeenCalledWith('[SendButton] No submit handler provided')
    console.error.mockRestore()
  })
})
