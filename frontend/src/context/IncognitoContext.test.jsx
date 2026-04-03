import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IncognitoProvider, useIncognito } from './IncognitoContext';

function TestComponent() {
  const { isIncognito, toggleIncognito } = useIncognito();
  return (
    <div>
      <span data-testid="status">{isIncognito ? 'ON' : 'OFF'}</span>
      <button onClick={toggleIncognito}>Toggle</button>
    </div>
  );
}

function ErrorComponent() {
  useIncognito();
  return null;
}

// Helper to suppress console.error during the deliberate error test
const suppressConsoleError = (fn) => {
  const originalError = console.error;
  console.error = () => {};
  try {
    fn();
  } finally {
    console.error = originalError;
  }
};

describe('IncognitoContext', () => {
  it('Provides isIncognito as false by default', () => {
    render(
      <IncognitoProvider>
        <TestComponent />
      </IncognitoProvider>
    );
    expect(screen.getByTestId('status').textContent).toBe('OFF');
  });

  it('toggleIncognito flips the value', () => {
    render(
      <IncognitoProvider>
        <TestComponent />
      </IncognitoProvider>
    );
    
    const button = screen.getByText('Toggle');
    expect(screen.getByTestId('status').textContent).toBe('OFF');
    
    fireEvent.click(button);
    expect(screen.getByTestId('status').textContent).toBe('ON');
    
    fireEvent.click(button);
    expect(screen.getByTestId('status').textContent).toBe('OFF');
  });

  it('useIncognito throws outside provider', () => {
    suppressConsoleError(() => {
      expect(() => render(<ErrorComponent />)).toThrow(
        'useIncognito must be used within an IncognitoProvider. Did you forget to wrap your component in <IncognitoProvider>?'
      );
    });
  });
});
