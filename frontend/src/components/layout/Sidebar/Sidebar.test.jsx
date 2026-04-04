/* global describe, it, expect, beforeEach, afterEach, vi */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar, { useSidebar } from '../Sidebar';
import { SidebarProvider, useSidebarContext } from '../../../context/SidebarContext';
import { IncognitoProvider } from '../../../context/IncognitoContext';
import UserProvider from '../../../context/UserContext';

vi.mock('../../../hooks/useSettings', () => ({
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

vi.mock('../../../hooks/usePopoverPosition', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    position: { top: 252, bottom: 'auto', left: 152, right: 'auto' },
    recalculate: vi.fn(),
  })),
}));

vi.mock('../../modals/SettingsModal', () => ({
  __esModule: true,
  default: function MockSettingsModal({ onClose }) {
    return (
      <div data-testid="settings-panel">
        <button onClick={onClose}>Close</button>
      </div>
    );
  },
}));

vi.mock('../../modals/ShortcutsPanel', () => ({
  __esModule: true,
  default: function MockShortcutsPanel({ onClose }) {
    return (
      <div data-testid="shortcuts-panel">
        <button onClick={onClose}>Close</button>
      </div>
    );
  },
}));

const DummyChild = () => {
  const isCollapsed = useSidebar();
  return <div data-testid="child-status">{isCollapsed ? 'collapsed' : 'expanded'}</div>;
};

const DummyOutside = () => {
  useSidebar();
  return null;
};

const AllProviders = ({ children }) => (
  <UserProvider>
    <IncognitoProvider>
      <SidebarProvider>
        {children}
      </SidebarProvider>
    </IncognitoProvider>
  </UserProvider>
);

const renderWithProviders = (ui) => {
  return render(
    <AllProviders>
      {ui}
    </AllProviders>
  );
};

describe('Sidebar', () => {
  let consoleError;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
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
    renderWithProviders(<Sidebar />);
    expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument();
  });

  it('Renders in expanded state by default', () => {
    renderWithProviders(
      <Sidebar>
        <DummyChild />
      </Sidebar>
    );
    expect(screen.getByRole('button', { name: /collapse sidebar/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('child-status')).toHaveTextContent('expanded');
  });

  it('Toggle button collapses sidebar', () => {
    renderWithProviders(
      <Sidebar>
        <DummyChild />
      </Sidebar>
    );
    const btn = screen.getByRole('button', { name: /collapse sidebar/i });
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('child-status')).toHaveTextContent('collapsed');
  });

  it('Toggle button expands sidebar after collapse', () => {
    renderWithProviders(
      <Sidebar>
        <DummyChild />
      </Sidebar>
    );
    const btn = screen.getByRole('button', { name: /collapse sidebar/i });

    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('child-status')).toHaveTextContent('expanded');
  });

  it('SidebarContext provides correct isCollapsed value to children', () => {
    renderWithProviders(
      <Sidebar>
        <DummyChild />
      </Sidebar>
    );
    expect(screen.getByTestId('child-status')).toHaveTextContent('expanded');
    fireEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }));
    expect(screen.getByTestId('child-status')).toHaveTextContent('collapsed');
  });

  it('useSidebar throws if used outside provider', () => {
    expect(() => render(<DummyOutside />)).toThrow('useSidebar must be used inside <Sidebar>');
  });

  it('Keyboard: Enter on toggle button changes state', () => {
    renderWithProviders(
      <Sidebar>
        <DummyChild />
      </Sidebar>
    );
    const btn = screen.getByRole('button', { name: /collapse sidebar/i });
    expect(btn).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(btn, { key: 'Enter', code: 'Enter' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');

    fireEvent.keyDown(btn, { key: ' ', code: 'Space' });
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('Drawer opens on mobile when isMobileOpen is true', () => {
    const TestHarness = () => {
      const { isMobileOpen, toggleMobileOpen } = useSidebarContext();
      return (
        <>
          <button data-testid="open" onClick={toggleMobileOpen}>Open</button>
          <span data-testid="state">{isMobileOpen ? 'open' : 'closed'}</span>
          <Sidebar />
        </>
      );
    };

    const { container } = render(
      <AllProviders>
        <TestHarness />
      </AllProviders>
    );

    const aside = container.querySelector('aside');
    expect(aside).not.toHaveClass('mobile-open');

    fireEvent.click(screen.getByTestId('open'));
    expect(aside).toHaveClass('mobile-open');
  });

  it('Backdrop renders when drawer is open', () => {
    const TestHarness = () => {
      const { toggleMobileOpen } = useSidebarContext();
      return (
        <>
          <button data-testid="open" onClick={toggleMobileOpen}>Open</button>
          <Sidebar />
        </>
      );
    };

    render(
      <AllProviders>
        <TestHarness />
      </AllProviders>
    );

    expect(document.querySelector('.sidebar-overlay')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('open'));
    expect(document.querySelector('.sidebar-overlay')).toBeInTheDocument();
  });

  it('Backdrop click closes drawer', () => {
    const TestHarness = () => {
      const { isMobileOpen, toggleMobileOpen } = useSidebarContext();
      return (
        <>
          <button data-testid="open" onClick={toggleMobileOpen}>Open</button>
          <span data-testid="state">{isMobileOpen ? 'open' : 'closed'}</span>
          <Sidebar />
        </>
      );
    };

    render(
      <AllProviders>
        <TestHarness />
      </AllProviders>
    );

    fireEvent.click(screen.getByTestId('open'));
    expect(screen.getByTestId('state')).toHaveTextContent('open');

    const overlay = document.querySelector('.sidebar-overlay');
    expect(overlay).toBeInTheDocument();

    fireEvent.click(overlay);
    expect(screen.getByTestId('state')).toHaveTextContent('closed');
  });

  it('Escape key closes drawer', () => {
    const TestHarness = () => {
      const { isMobileOpen, toggleMobileOpen } = useSidebarContext();
      return (
        <>
          <button data-testid="open" onClick={toggleMobileOpen}>Open</button>
          <span data-testid="state">{isMobileOpen ? 'open' : 'closed'}</span>
          <Sidebar />
        </>
      );
    };

    render(
      <AllProviders>
        <TestHarness />
      </AllProviders>
    );

    fireEvent.click(screen.getByTestId('open'));
    expect(screen.getByTestId('state')).toHaveTextContent('open');
    expect(document.querySelector('.sidebar-overlay')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(screen.getByTestId('state')).toHaveTextContent('closed');
  });

  it('Collapse toggle visible on desktop', () => {
    const { container } = renderWithProviders(<Sidebar />);
    const toggle = container.querySelector('.sidebar-toggle');
    expect(toggle).toBeInTheDocument();
  });

  it('Toggle button on mobile closes drawer instead of collapsing', () => {
    const TestHarness = () => {
      const { isMobileOpen, toggleMobileOpen } = useSidebarContext();
      return (
        <>
          <button data-testid="open" onClick={toggleMobileOpen}>Open</button>
          <span data-testid="state">{isMobileOpen ? 'open' : 'closed'}</span>
          <Sidebar />
        </>
      );
    };

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 400,
    });

    render(
      <AllProviders>
        <TestHarness />
      </AllProviders>
    );

    fireEvent.click(screen.getByTestId('open'));
    expect(screen.getByTestId('state')).toHaveTextContent('open');

    const toggle = screen.getByRole('button', { name: /collapse sidebar/i });
    fireEvent.click(toggle);
    expect(screen.getByTestId('state')).toHaveTextContent('closed');
  });

  it('Toggle button on desktop collapses sidebar (not closeMobile)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    renderWithProviders(
      <Sidebar>
        <DummyChild />
      </Sidebar>
    );
    const btn = screen.getByRole('button', { name: /collapse sidebar/i });
    fireEvent.click(btn);
    expect(screen.getByTestId('child-status')).toHaveTextContent('collapsed');
  });

  it('Body scroll locked when drawer open', () => {
    const TestHarness = () => {
      const { isMobileOpen, toggleMobileOpen } = useSidebarContext();
      return (
        <>
          <button data-testid="open" onClick={toggleMobileOpen}>Open</button>
          <span data-testid="state">{isMobileOpen ? 'open' : 'closed'}</span>
          <Sidebar />
        </>
      );
    };

    render(
      <AllProviders>
        <TestHarness />
      </AllProviders>
    );

    expect(document.body.style.overflow).toBe('');

    fireEvent.click(screen.getByTestId('open'));
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(document.body.style.overflow).toBe('');
  });

  it('Device orientation change closes drawer', () => {
    const TestHarness = () => {
      const { isMobileOpen, toggleMobileOpen } = useSidebarContext();
      return (
        <>
          <button data-testid="open" onClick={toggleMobileOpen}>Open</button>
          <span data-testid="state">{isMobileOpen ? 'open' : 'closed'}</span>
          <Sidebar />
        </>
      );
    };

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 400,
    });

    render(
      <AllProviders>
        <TestHarness />
      </AllProviders>
    );

    fireEvent.click(screen.getByTestId('open'));
    expect(screen.getByTestId('state')).toHaveTextContent('open');

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    fireEvent(window, new Event('resize'));
    expect(screen.getByTestId('state')).toHaveTextContent('closed');
  });

  it('Resizing from desktop collapsed to mobile resets collapsed state', () => {
    const TestHarness = () => {
      const { isDesktopCollapsed, toggleDesktopCollapsed } = useSidebarContext();
      return (
        <>
          <button data-testid="collapse" onClick={toggleDesktopCollapsed}>Collapse</button>
          <span data-testid="collapsed-state">{isDesktopCollapsed ? 'collapsed' : 'expanded'}</span>
          <Sidebar />
        </>
      );
    };

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    render(
      <AllProviders>
        <TestHarness />
      </AllProviders>
    );

    fireEvent.click(screen.getByTestId('collapse'));
    expect(screen.getByTestId('collapsed-state')).toHaveTextContent('collapsed');

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 400,
    });

    fireEvent(window, new Event('resize'));
    expect(screen.getByTestId('collapsed-state')).toHaveTextContent('expanded');
  });
});
