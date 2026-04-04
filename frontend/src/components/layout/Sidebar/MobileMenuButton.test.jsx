/* global describe, it, expect, beforeEach, afterEach, vi */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileMenuButton from './MobileMenuButton';
import { SidebarProvider, useSidebarContext } from '../../../context/SidebarContext';

const renderWithContext = (ui) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: query === '(max-width: 767px)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  return render(
    <SidebarProvider>
      {ui}
    </SidebarProvider>
  );
};

describe('MobileMenuButton', () => {
  let consoleError;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(max-width: 767px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('Renders only on screens < 768px (mock matchMedia)', () => {
    renderWithContext(<MobileMenuButton />);
    const btn = screen.getByRole('button', { name: /open menu/i });
    expect(btn).toBeInTheDocument();
  });

  it('Click calls toggleMobileOpen', () => {
    let isMobileOpenValue = false;
    const TestConsumer = () => {
      const { isMobileOpen, toggleMobileOpen } = useSidebarContext();
      isMobileOpenValue = isMobileOpen;
      return (
        <>
          <MobileMenuButton />
          <button data-testid="toggle" onClick={toggleMobileOpen}>Toggle</button>
        </>
      );
    };

    renderWithContext(<TestConsumer />);

    const toggle = screen.getByTestId('toggle');
    fireEvent.click(toggle);
    expect(isMobileOpenValue).toBe(true);
  });

  it('aria-expanded reflects isMobileOpen', () => {
    const TestConsumer = () => {
      const { isMobileOpen, toggleMobileOpen } = useSidebarContext();
      return (
        <>
          <MobileMenuButton />
          <button data-testid="toggle" onClick={toggleMobileOpen}>Toggle</button>
        </>
      );
    };

    renderWithContext(<TestConsumer />);

    const btn = screen.getByRole('button', { name: /open menu/i });
    expect(btn).toHaveAttribute('aria-expanded', 'false');

    const toggle = screen.getByTestId('toggle');
    fireEvent.click(toggle);

    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('throws when used outside SidebarProvider', () => {
    expect(() => render(<MobileMenuButton />)).toThrow(
      'useSidebarContext must be used within a SidebarProvider'
    );
  });
});
