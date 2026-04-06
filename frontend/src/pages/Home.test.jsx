/* global describe, it, expect, beforeEach, afterEach, vi */
import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from './Home';
import { SidebarProvider } from '../context/SidebarContext';
import { IncognitoProvider } from '../context/IncognitoContext';
import { SessionProvider } from '../context/Session';

vi.mock('../services/api', () => ({
  health: vi.fn(() => Promise.resolve({ data: { status: 'ok' } })),
  getModels: vi.fn(() => Promise.resolve({ data: { models: [] } })),
  enhance: vi.fn(() => Promise.resolve({ data: { enhanced_prompt: '' } })),
  stt: vi.fn(),
}));

vi.mock('../hooks/useSettings', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    openRouterKey: null,
    saveKey: vi.fn(),
    clearKey: vi.fn(),
    keyStatus: 'idle',
    selectedModel: '',
    saveModel: vi.fn(),
    models: [],
    modelsError: null,
    inferenceMode: 'local',
  })),
}));

vi.mock('../hooks/useEnhance', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    run: vi.fn(),
    abort: vi.fn(),
  })),
}));

vi.mock('../hooks/useRecorder', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    recording: false,
    error: null,
    start: vi.fn(),
    stop: vi.fn(),
  })),
}));

vi.mock('../config/config', () => ({
  FEATURES: { SHOW_BACKEND_STATUS_BAR: false },
  APP_CONFIG: { APP_NAME: 'Chota Packet', GITHUB_REPO_URL: 'https://github.com/AbhayMalav/Chota-Packet' },
}));

vi.mock('../context/UserContext', () => ({
  __esModule: true,
  default: ({ children }) => children,
  useUser: vi.fn(() => [{ name: 'Guest User', email: 'guest@example.com', avatar: null }, vi.fn()]),
}));

vi.mock('../context/Theme', () => ({
  ThemeProvider: ({ children }) => children,
}));

vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => children,
}));

const renderHome = () => {
  return render(
    <SessionProvider resetSession={vi.fn()}>
      <SidebarProvider>
        <IncognitoProvider>
          <Home />
        </IncognitoProvider>
      </SidebarProvider>
    </SessionProvider>
  );
};

describe('Home Layout - Scrollable Main Content', () => {
  let consoleWarn;

  beforeEach(() => {
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    consoleWarn.mockRestore();
  });

  it('main element has overflow-y-auto class for vertical scrolling', () => {
    const { container } = renderHome();
    const main = container.querySelector('main');
    expect(main).toHaveClass('overflow-y-auto');
  });

  it('main element has min-h-0 class to allow flex child overflow', () => {
    const { container } = renderHome();
    const main = container.querySelector('main');
    expect(main).toHaveClass('min-h-0');
  });

  it('main element has flex-1 to fill available space', () => {
    const { container } = renderHome();
    const main = container.querySelector('main');
    expect(main).toHaveClass('flex-1');
  });

  it('sidebar does NOT have overflow-y-auto (remains non-scrollable)', () => {
    const { container } = renderHome();
    const sidebar = container.querySelector('.sidebar');
    expect(sidebar).not.toHaveClass('overflow-y-auto');
  });

  it('sidebar has correct class for sticky positioning on desktop', () => {
    const { container } = renderHome();
    const sidebar = container.querySelector('.sidebar');
    expect(sidebar).toHaveClass('sidebar');
    expect(sidebar).toHaveClass('expanded');
  });

  it('main content area renders all core sections', () => {
    const { container } = renderHome();
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('flex-col');
  });
});
