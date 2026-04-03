import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import HistorySection from './HistorySection';


// Mock useSidebar — must match exactly how HistorySection imports it
const mockUseSidebar = vi.fn();
vi.mock('./Sidebar', async () => {
  const actual = await vi.importActual('./Sidebar');
  return {
    ...actual,
    useSidebar: () => mockUseSidebar(),
  };
});

describe('HistorySection', () => {
  beforeEach(() => {
    mockUseSidebar.mockReturnValue({ isCollapsed: false });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });


  // ── Data rendering ──────────────────────────────────────────────────────────

  it('Renders list of history items from props', () => {
    const history = [
      { input: 'Write a haiku about AI', ts: 1 },
      { input: 'Explain quantum computing simply', ts: 2 },
    ];
    render(<HistorySection history={history} />);
    expect(screen.getByText('Write a haiku about AI')).toBeInTheDocument();
    expect(screen.getByText('Explain quantum computing simply')).toBeInTheDocument();
  });

  it('Renders empty state when array is empty', () => {
    render(<HistorySection history={[]} />);
    expect(screen.getByText('No history yet')).toBeInTheDocument();
  });

  it('Renders empty state when prop is null', () => {
    render(<HistorySection history={null} />);
    expect(screen.getByText('No history yet')).toBeInTheDocument();
  });

  it('Renders empty state when prop is undefined', () => {
    render(<HistorySection />);
    expect(screen.getByText('No history yet')).toBeInTheDocument();
  });

  // ── Malformed items ─────────────────────────────────────────────────────────

  it('Skips and warns on malformed items', () => {
    const history = [
      null,
      undefined,
      {},
      { input: 'Valid prompt', ts: 1 },
    ];
    render(<HistorySection history={history} />);

    // Malformed items (null, undefined, {}) should warn
    expect(console.warn).toHaveBeenCalledWith(
      'Skipping malformed history item:',
      null
    );
    expect(console.warn).toHaveBeenCalledWith(
      'Skipping malformed history item:',
      undefined
    );
    expect(console.warn).toHaveBeenCalledWith(
      'Skipping malformed history item:',
      {}
    );

    // The valid item should render
    expect(screen.getByText('Valid prompt')).toBeInTheDocument();
  });

  // ── Collapsed state ─────────────────────────────────────────────────────────

  it('Hidden in collapsed state (section not in DOM)', () => {
    mockUseSidebar.mockReturnValue({ isCollapsed: true });
    const history = [{ input: 'Some prompt', ts: 1 }];
    const { container } = render(<HistorySection history={history} />);

    // The whole section should be absent — not just hidden via CSS
    expect(container.querySelector('.history-section')).not.toBeInTheDocument();
    expect(screen.queryByText('Some prompt')).not.toBeInTheDocument();
  });

  // ── View All link ───────────────────────────────────────────────────────────

  it('"View All" link renders', () => {
    render(<HistorySection history={[]} />);
    expect(screen.getByLabelText('View all history (coming soon)')).toBeInTheDocument();
  });

  // ── Performance / edge cases ────────────────────────────────────────────────

  it('Does not crash with 100 items', () => {
    const history = Array.from({ length: 100 }, (_, i) => ({
      input: `Prompt number ${i + 1}`,
      ts: i,
    }));
    expect(() => render(<HistorySection history={history} />)).not.toThrow();
    expect(screen.getByText('Prompt number 1')).toBeInTheDocument();
    expect(screen.getByText('Prompt number 100')).toBeInTheDocument();
  });
});
