/* eslint-env jest */
/* global describe, it, expect, beforeEach, afterEach, jest */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NewThreadButton from './NewThreadButton';
import { SidebarContext } from '../Sidebar'; // we have to export this or mock useSidebar
import * as SidebarModule from '../Sidebar';
import * as SessionStoreModule from '../../../context/Session';

// We need to mock useSidebar and useSessionStore
jest.mock('./Sidebar', () => ({
  ...jest.requireActual('./Sidebar'),
  useSidebar: jest.fn(),
}));

jest.mock('../../store/sessionStore.jsx', () => ({
  useSessionStore: jest.fn(),
}));

describe('NewThreadButton', () => {
  let consoleError;
  let consoleWarn;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    consoleError.mockRestore();
    consoleWarn.mockRestore();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  const setup = (isCollapsed = false, resetSession = jest.fn()) => {
    SidebarModule.useSidebar.mockReturnValue({ isCollapsed });
    SessionStoreModule.useSessionStore.mockReturnValue({ resetSession });
    render(<NewThreadButton />);
    return { resetSession };
  };

  it('Renders with icon and label in expanded state', () => {
    setup(false);
    expect(screen.getByLabelText('Start new thread')).toBeInTheDocument();
    expect(screen.getByText('New Thread')).toBeInTheDocument();
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
    const mockReset = jest.fn();
    setup(false, mockReset);
    
    const button = screen.getByLabelText('Start new thread');
    fireEvent.click(button);
    
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('Double-click does not call resetSession twice', () => {
    const mockReset = jest.fn();
    setup(false, mockReset);
    
    const button = screen.getByLabelText('Start new thread');
    fireEvent.click(button);
    fireEvent.click(button);
    
    expect(mockReset).toHaveBeenCalledTimes(1);
    
    // advance timer to clear debounce
    jest.advanceTimersByTime(300);
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

  it('Ongoing fetch is aborted on click (mock AbortController)', () => {
    // This tests the simulated abort controller logic throwing in resetSession
    const mockReset = jest.fn().mockImplementation(() => {
      // Simulate fetch abort failing or throwing
      throw new Error('fetch abort test');
    });
    
    setup(false, mockReset);
    
    const button = screen.getByLabelText('Start new thread');
    fireEvent.click(button);
    
    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(consoleWarn).toHaveBeenCalledWith('Could not abort in-flight request on new thread');
  });
});
