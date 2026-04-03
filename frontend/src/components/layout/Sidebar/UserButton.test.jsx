import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import UserButton from './UserButton'
import { useUser } from '../../../context/UserContext'
import { useSidebar } from './Sidebar'

// Mock the hooks
jest.mock('../../../context/UserContext', () => ({
  useUser: jest.fn()
}))

jest.mock('./Sidebar', () => ({
  useSidebar: jest.fn()
}))

describe('UserButton', () => {
  beforeEach(() => {
    useSidebar.mockReturnValue({ isCollapsed: false })
  })

  it('Renders with initials when avatar is null', () => {
    useUser.mockReturnValue({ user: { name: 'Guest User', avatar: null } })
    render(<UserButton />)
    expect(screen.getByText('GU')).toBeInTheDocument()
  })

  it('Renders with image when avatar URL provided', () => {
    useUser.mockReturnValue({ user: { name: 'Guest User', avatar: 'https://example.com/avatar.png' } })
    render(<UserButton />)
    const img = screen.getByRole('img', { hidden: true })
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.png')
  })

  it('Shows name and email in expanded state', () => {
    useUser.mockReturnValue({ user: { name: 'Guest User', email: 'guest@example.com' } })
    render(<UserButton />)
    expect(screen.getByText('Guest User')).toBeInTheDocument()
    expect(screen.getByText('guest@example.com')).toBeInTheDocument()
  })

  it('Shows only avatar in collapsed state', () => {
    useUser.mockReturnValue({ user: { name: 'Guest User', email: 'guest@example.com' } })
    useSidebar.mockReturnValue({ isCollapsed: true })
    render(<UserButton />)
    
    expect(screen.getByText('GU')).toBeInTheDocument()
    expect(screen.queryByText('Guest User')).not.toBeInTheDocument()
    expect(screen.queryByText('guest@example.com')).not.toBeInTheDocument()
  })

  it('Tooltip shows name in collapsed state', () => {
    useUser.mockReturnValue({ user: { name: 'Guest User' } })
    useSidebar.mockReturnValue({ isCollapsed: true })
    render(<UserButton />)
    
    const btn = screen.getByRole('button', { name: /user menu/i })
    expect(btn).toHaveAttribute('title', 'Guest User')
  })

  it('Null name falls back to "User"', () => {
    useUser.mockReturnValue({ user: { name: null } })
    render(<UserButton />)
    
    expect(screen.getByText('U')).toBeInTheDocument() // Initials
    expect(screen.getByText('User')).toBeInTheDocument() // Display Name
  })
})