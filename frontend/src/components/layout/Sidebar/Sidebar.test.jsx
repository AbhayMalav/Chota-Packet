/* eslint-env jest */
/* global describe, it, expect, beforeEach, afterEach, jest */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar, { useSidebar } from '../Sidebar';

// A dummy child to test context
const DummyChild = () => {
  const { isCollapsed } = useSidebar();
  return <div data-testid="child-status">{isCollapsed ? 'collapsed' : 'expanded'}</div>;
};

const DummyOutside = () => {
  useSidebar();
  return null;
};

describe('Sidebar', () => {
  let consoleError;

  beforeEach(() => {
    // Suppress React error boundary logs for the expected throw test
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Clear innerWidth mock if it was changed
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('Renders without crashing with no children', () => {
    render(<Sidebar />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('Renders in expanded state by default', () => {
    render(
      <Sidebar>
        <DummyChild />
      </Sidebar>
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('child-status')).toHaveTextContent('expanded');
  });

  it('Toggle button collapses sidebar', () => {
    render(
      <Sidebar>
        <DummyChild />
      </Sidebar>
    );
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    // After click, it should be collapsed
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('child-status')).toHaveTextContent('collapsed');
  });

  it('Toggle button expands sidebar after collapse', () => {
    render(
      <Sidebar>
        <DummyChild />
      </Sidebar>
    );
    const btn = screen.getByRole('button');
    
    // collapse
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    
    // expand
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('child-status')).toHaveTextContent('expanded');
  });

  it('SidebarContext provides correct isCollapsed value to children', () => {
    render(
      <Sidebar>
        <DummyChild />
      </Sidebar>
    );
    expect(screen.getByTestId('child-status')).toHaveTextContent('expanded');
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('child-status')).toHaveTextContent('collapsed');
  });

  it('useSidebar throws if used outside provider', () => {
    expect(() => render(<DummyOutside />)).toThrow('useSidebar must be used inside <Sidebar>');
  });

  it('Keyboard: Enter on toggle button changes state', () => {
    render(
      <Sidebar>
        <DummyChild />
      </Sidebar>
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    
    fireEvent.keyDown(btn, { key: 'Enter', code: 'Enter' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    
    fireEvent.keyDown(btn, { key: ' ', code: 'Space' });
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });
});
