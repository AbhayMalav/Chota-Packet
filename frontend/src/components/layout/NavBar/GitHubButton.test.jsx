import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'


vi.mock('lucide-react', () => ({
  Github: function MockGithub(props) {
    return React.createElement('svg', { ...props, 'data-testid': 'github-icon' })
  },
}))

describe('GitHubButton', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders with aria-label="View source on GitHub"', async () => {
    vi.doMock('../../../config/config', () => ({
      APP_CONFIG: {
        APP_NAME: 'Chota Packet',
        GITHUB_REPO_URL: 'https://github.com/AbhayMalav/Chota-Packet',
      },
    }))

    const GitHubButton = (await import('./GitHubButton')).default
    render(<GitHubButton />)

    const link = screen.getByRole('link', { name: 'View source on GitHub' })
    expect(link).toBeInTheDocument()
  })

  it('link has correct href from config', async () => {
    vi.doMock('../../../config/config', () => ({
      APP_CONFIG: {
        APP_NAME: 'Chota Packet',
        GITHUB_REPO_URL: 'https://github.com/AbhayMalav/Chota-Packet',
      },
    }))

    const GitHubButton = (await import('./GitHubButton')).default
    render(<GitHubButton />)

    const link = screen.getByRole('link', { name: 'View source on GitHub' })
    expect(link).toHaveAttribute('href', 'https://github.com/AbhayMalav/Chota-Packet')
  })

  it('link has target="_blank" and rel="noopener noreferrer"', async () => {
    vi.doMock('../../../config/config', () => ({
      APP_CONFIG: {
        APP_NAME: 'Chota Packet',
        GITHUB_REPO_URL: 'https://github.com/AbhayMalav/Chota-Packet',
      },
    }))

    const GitHubButton = (await import('./GitHubButton')).default
    render(<GitHubButton />)

    const link = screen.getByRole('link', { name: 'View source on GitHub' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('tooltip renders on hover', async () => {
    vi.doMock('../../../config/config', () => ({
      APP_CONFIG: {
        APP_NAME: 'Chota Packet',
        GITHUB_REPO_URL: 'https://github.com/AbhayMalav/Chota-Packet',
      },
    }))

    const GitHubButton = (await import('./GitHubButton')).default
    render(<GitHubButton />)

    const link = screen.getByRole('link', { name: 'View source on GitHub' })
    expect(link).toHaveAttribute('title', 'View Source Code')
  })

  it('hidden when GITHUB_REPO_URL is missing from config', async () => {
    vi.doMock('../../../config/config', () => ({
      APP_CONFIG: { APP_NAME: 'Chota Packet' },
    }))

    const GitHubButton = (await import('./GitHubButton')).default
    const { container } = render(<GitHubButton />)
    expect(container.firstChild).toBeNull()
  })

  it('logs error when GITHUB_REPO_URL is missing', async () => {
    vi.doMock('../../../config/config', () => ({
      APP_CONFIG: { APP_NAME: 'Chota Packet' },
    }))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const GitHubButton = (await import('./GitHubButton')).default
    render(<GitHubButton />)

    expect(consoleError).toHaveBeenCalledWith('[GitHubButton] GITHUB_REPO_URL not set in config')
  })
})
