/* global describe, it, expect, beforeEach, afterEach, vi */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from './Home';
import { SidebarProvider } from '../context/SidebarContext';
import { IncognitoProvider } from '../context/IncognitoContext';
import { SessionProvider } from '../context/Session';

const mockModels = [
  { id: 'local', name: 'Local Model (Free, Offline)', cost_per_1k_tokens: 0, context_window: 512 },
  { id: 'openrouter/auto', name: 'Auto Router (Best Available)', cost_per_1k_tokens: 0, context_window: 200000 },
];

vi.mock('../services/api', () => ({
  health: vi.fn(() => Promise.resolve({ data: { status: 'ok' } })),
  getModels: vi.fn(() => Promise.resolve({ data: { models: mockModels } })),
  enhance: vi.fn(() => Promise.resolve({ data: { enhanced_prompt: 'Enhanced test prompt', model_used: 'mock-mt5' } })),
  stt: vi.fn(),
}));

vi.mock('../hooks/useSettings', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    openRouterKey: null,
    saveKey: vi.fn(),
    clearKey: vi.fn(),
    keyStatus: 'idle',
    selectedModel: 'local',
    saveModel: vi.fn(),
    models: mockModels,
    modelsError: null,
    inferenceMode: 'local',
  })),
}));

vi.mock('../hooks/useEnhance', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    run: vi.fn(() => Promise.resolve({ enhanced_prompt: 'Enhanced test prompt' })),
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
  useTheme: vi.fn(() => ({ language: 'en' })),
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

describe('Home - Model Loading and Enhancement', () => {
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

  it('renders ControlBar with enhance button', async () => {
    renderHome();
    const enhanceBtn = document.getElementById('enhance-btn');
    expect(enhanceBtn).toBeInTheDocument();
  });

  it('renders ModelPill with models passed from useSettings', async () => {
    renderHome();
    await waitFor(() => {
      const modelPill = document.querySelector('#model-pill-btn');
      expect(modelPill).toBeInTheDocument();
      expect(modelPill).not.toBeDisabled();
    });
  });

  it('has input field for entering prompt', async () => {
    renderHome();
    const input = await screen.findByPlaceholderText(/enter your prompt/i);
    expect(input).toBeInTheDocument();
  });

  it('calls enhance when enhance button is clicked', async () => {
    const mockRun = vi.fn(() => Promise.resolve({ enhanced_prompt: 'Enhanced test prompt' }));
    
    const useEnhanceMock = vi.mocked((await import('../hooks/useEnhance')).default);
    useEnhanceMock.mockImplementation(() => ({
      run: mockRun,
      abort: vi.fn(),
    }));
    
    renderHome();
    
    const input = await screen.findByPlaceholderText(/enter your prompt/i);
    await userEvent.type(input, 'test prompt');
    
    const enhanceBtn = document.getElementById('enhance-btn');
    expect(enhanceBtn).toBeInTheDocument();
    await userEvent.click(enhanceBtn);
    
    await waitFor(() => {
      expect(mockRun).toHaveBeenCalled();
    });
  });
});