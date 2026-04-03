import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ChotaChatButton from './ChotaChatButton';
import * as SidebarModule from '../Sidebar';

// We need to mock useSidebar
vi.mock('./Sidebar', async () => {
  const actual = await vi.importActual('./Sidebar');
  return {
    ...actual,
    useSidebar: vi.fn(),
  };
});

describe('ChotaChatButton', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const setupTest = async (isCollapsed, showChotaChat) => {
    SidebarModule.useSidebar.mockReturnValue({ isCollapsed });
    // Mock the config
    vi.doMock('../../../config/config', () => ({
      FEATURES: { SHOW_CHOTA_CHAT: showChotaChat }
    }));
    
    // We must re-require the component so it uses the newly mocked config
    const ChotaChatButtonDynamic = (await import('./ChotaChatButton')).default;
    render(<ChotaChatButtonDynamic />);
  };

  it('Does NOT render when SHOW_CHOTA_CHAT is false', async () => {
    await setupTest(false, false);
    expect(screen.queryByLabelText('Chota Chat')).not.toBeInTheDocument();
  });

  it('Renders when SHOW_CHOTA_CHAT is true', async () => {
    await setupTest(false, true);
    expect(screen.getByLabelText('Chota Chat')).toBeInTheDocument();
    expect(screen.getByText('Chota Chat')).toBeInTheDocument();
  });

  it('Shows "Soon" badge in expanded state', async () => {
    await setupTest(false, true);
    expect(screen.getByText('Soon')).toBeInTheDocument();
  });

  it('Hides badge in collapsed state', async () => {
    await setupTest(true, true);
    expect(screen.queryByText('Soon')).not.toBeInTheDocument();
    expect(screen.queryByText('Chota Chat')).not.toBeInTheDocument();
  });

  it('Click shows coming soon toast', async () => {
    await setupTest(false, true);
    const btn = screen.getByLabelText('Chota Chat');
    fireEvent.click(btn);
    expect(screen.getByText('Chota Chat is coming soon!')).toBeInTheDocument();
  });

  it('Rapid clicks do not stack multiple toasts', async () => {
    await setupTest(false, true);
    const btn = screen.getByLabelText('Chota Chat');
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);
    
    const toasts = screen.getAllByText('Chota Chat is coming soon!');
    expect(toasts).toHaveLength(1);
  });

  it('Toast auto-dismisses after 3s (fake timers)', async () => {
    await setupTest(false, true);
    const btn = screen.getByLabelText('Chota Chat');
    fireEvent.click(btn);
    
    expect(screen.getByText('Chota Chat is coming soon!')).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    expect(screen.queryByText('Chota Chat is coming soon!')).not.toBeInTheDocument();
  });
});
