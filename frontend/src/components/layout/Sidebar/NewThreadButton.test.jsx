import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import NewThreadButton from './NewThreadButton';

const { mockUseSidebar, mockUseSessionStore } = vi.hoisted(() => ({
  mockUseSidebar: vi.fn(),
  mockUseSessionStore: vi.fn(),
}));

vi.mock('./Sidebar', () => ({
  useSidebar: mockUseSidebar,
}));

vi.mock('./Sidebar', () => ({
  useSidebar: mockUseSidebar,
}));

vi.mock('../../../context/Session', () => ({
  useSessionStore: mockUseSessionStore,
}));

describe('NewThreadButton', () => {
  let consoleError;
  let consoleWarn;
  let mockReset;

  beforeEach(() => {
    mockReset = vi.fn();
    mockUseSidebar.mockReturnValue({ isCollapsed: false });
    mockUseSessionStore.mockReturnValue({ resetSession: mockReset });
    
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.useFakeTimers();
  });

  afterEach(() => {
    consoleError.mockRestore();
    consoleWarn.mockRestore();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const setup = (isCollapsed = false, resetSession = vi.fn()) => {
    mockUseSidebar.mockReturnValue({ isCollapsed });
    mockUseSessionStore.mockReturnValue({ resetSession });
    render(<NewThreadButton />);
    return { resetSession };
  };

  it('Renders with icon and label in expanded state', () => {
    const mockReset = vi.fn();
    mockUseSidebar.mockReturnValue({ isCollapsed: false });
    mockUseSessionStore.mockReturnValue({ resetSession: mockReset });
    render(<NewThreadButton />);
    expect(screen.getByLabelText('Start new thread')).toBeInTheDocument();
    expect(screen.queryByText('New Thread')).toBeInTheDocument();
  });

  it('Renders with icon only in collapsed state', () => {
    setup(true);
    expect(screen.getByLabelText('Start new thread')).toBeInTheDocument();
    expect(screen.queryByText('New Thread')).not.toBeInTheDocument();
  });

  it('Tooltip renders in collapsed state on hover', () => {
    setup(true);
    const button = screen.getByLabelText('Start new thread');
    
    // not hovered initially
    expect(screen.queryByText('New Thread')).not.toBeInTheDocument();
    
    // hover
    fireEvent.mouseEnter(button);
    expect(screen.getByText('New Thread')).toBeInTheDocument();
    expect(screen.getByText('New Thread')).toHaveClass('new-thread-tooltip');
    
    // leave
    fireEvent.mouseLeave(button);
    expect(screen.queryByText('New Thread')).not.toBeInTheDocument();
  });

  it('Click calls resetSession exactly once', () => {
    const mockReset = vi.fn();
    setup(false, mockReset);
    
    const button = screen.getByLabelText('Start new thread');
    fireEvent.click(button);
    
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('Double-click does not call resetSession twice', () => {
    const mockReset = vi.fn();
    setup(false, mockReset);
    
    const button = screen.getByLabelText('Start new thread');
    fireEvent.click(button);
    fireEvent.click(button);
    
    expect(mockReset).toHaveBeenCalledTimes(1);
    
    // advance timer to clear debounce
    vi.advanceTimersByTime(300);
    fireEvent.click(button);
    expect(mockReset).toHaveBeenCalledTimes(2);
  });

  it('Button is disabled when resetSession is unavailable', () => {
    setup(false, null);
    
    const button = screen.getByLabelText('Start new thread');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled');
    
    expect(consoleError).toHaveBeenCalledWith('resetSession is not available from context/store');
  });

  it('Logs warning when resetSession throws an error', () => {
    const mockReset = vi.fn().mockImplementation(() => {
      throw new Error('fetch abort test');
    });
    
    setup(false, mockReset);
    
    const button = screen.getByLabelText('Start new thread');
    fireEvent.click(button);
    
    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(consoleWarn).toHaveBeenCalledWith('Could not abort in-flight request on new thread');
  });
});
