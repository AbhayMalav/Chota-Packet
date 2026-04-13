import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import LanguagePanel from './LanguagePanel'

vi.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({ mode: 'dark', themeColor: 'brand' }),
}))

describe('LanguagePanel', () => {
  const mockOnBack = vi.fn()
  const mockOnLanguageChange = vi.fn()

  it('renders language options', () => {
    render(
      <LanguagePanel
        onBack={mockOnBack}
        onLanguageChange={mockOnLanguageChange}
      />
    )
    expect(screen.getByText('English')).toBeInTheDocument()
    expect(screen.getByText('Hindi')).toBeInTheDocument()
  })

  it('calls onLanguageChange when selecting a language', () => {
    render(
      <LanguagePanel
        onBack={mockOnBack}
        onLanguageChange={mockOnLanguageChange}
      />
    )
    fireEvent.click(screen.getByText('English'))
    expect(mockOnLanguageChange).toHaveBeenCalledWith('en')
  })

  it('renders back button with language label', () => {
    render(
      <LanguagePanel
        onBack={mockOnBack}
        onLanguageChange={mockOnLanguageChange}
      />
    )
    expect(screen.getByText('Language')).toBeInTheDocument()
  })
})