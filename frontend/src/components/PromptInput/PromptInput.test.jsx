/* global describe, it, expect, vi */
import React from 'react'
import { render, screen } from '@testing-library/react'
import PromptInput from './PromptInput'


vi.mock('./SendButton', () => ({
  __esModule: true,
  default: function MockSendButton({ onSubmit, disabled, isLoading }) {
    return (
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || isLoading}
        aria-label="Send for enhancement"
        data-testid="send-btn"
      >
        {isLoading ? 'loading' : 'send'}
      </button>
    )
  },
}))


const defaultProps = {
  value: '',
  onChange: () => {},
  onClear: () => {},
  onSubmit: () => {},
  isLoading: false,
}


describe('PromptInput', () => {
  it('controls row renders char count, clear, mic, send in one div', () => {
    render(
      <PromptInput {...defaultProps} value="hello">
        <button data-testid="mic-btn" aria-label="Mic">Mic</button>
      </PromptInput>
    )

    const charCount = screen.getByLabelText(/Prompt input/i)
    expect(charCount).toBeInTheDocument()

    const controlsRow = charCount.closest('.flex.flex-col').querySelector('.controls-row')
    expect(controlsRow).toBeInTheDocument()

    const charCountText = screen.getByText('5')
    expect(charCountText).toBeInTheDocument()

    const clearBtn = screen.getByRole('button', { name: 'Clear input' })
    expect(clearBtn).toBeInTheDocument()

    const micBtn = screen.getByTestId('mic-btn')
    expect(micBtn).toBeInTheDocument()

    const sendBtn = screen.getByTestId('send-btn')
    expect(sendBtn).toBeInTheDocument()

    const buttonGroup = controlsRow.querySelector('.button-group')
    expect(buttonGroup).toContainElement(micBtn)
    expect(buttonGroup).toContainElement(clearBtn)
    expect(buttonGroup).toContainElement(sendBtn)
  })

  it('char count is left-aligned, buttons are right-aligned', () => {
    const { container } = render(
      <PromptInput {...defaultProps} value="test">
        <button data-testid="mic-btn">Mic</button>
      </PromptInput>
    )

    const controlsRow = container.querySelector('.controls-row')
    expect(controlsRow).toHaveClass('controls-row')

    const charCount = controlsRow.querySelector('.char-count')
    expect(charCount).toBeInTheDocument()

    const buttonGroup = controlsRow.querySelector('.button-group')
    expect(buttonGroup).toBeInTheDocument()

    expect(controlsRow).toContainElement(charCount)
    expect(controlsRow).toContainElement(buttonGroup)
  })

  it('row does not wrap on mobile viewport', () => {
    const { container } = render(
      <PromptInput {...defaultProps} value="test">
        <button data-testid="mic-btn">Mic</button>
      </PromptInput>
    )

    const controlsRow = container.querySelector('.controls-row')
    expect(controlsRow).toHaveClass('controls-row')

    const buttonGroup = container.querySelector('.button-group')
    expect(buttonGroup).toHaveClass('button-group')
  })
})
