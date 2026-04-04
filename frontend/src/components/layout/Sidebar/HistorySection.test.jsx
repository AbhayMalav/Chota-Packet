import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
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

// Helper: hover over a history item to reveal its pin button
function hoverItem(itemButton) {
  fireEvent.mouseEnter(itemButton);
}

describe('HistorySection', () => {
  beforeEach(() => {
    mockUseSidebar.mockReturnValue(false);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
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

    expect(console.warn).toHaveBeenCalledWith(
      'Skipping malformed history item',
      null
    );
    expect(console.warn).toHaveBeenCalledWith(
      'Skipping malformed history item',
      undefined
    );
    expect(console.warn).toHaveBeenCalledWith(
      'Skipping malformed history item',
      {}
    );

    expect(screen.getByText('Valid prompt')).toBeInTheDocument();
  });

  // ── Collapsed state ─────────────────────────────────────────────────────────

  it('Hidden in collapsed state (section not in DOM)', () => {
    mockUseSidebar.mockReturnValue(true);
    const history = [{ input: 'Some prompt', ts: 1 }];
    const { container } = render(<HistorySection history={history} />);

    expect(container.querySelector('.history-section')).not.toBeInTheDocument();
    expect(screen.queryByText('Some prompt')).not.toBeInTheDocument();
  });

  // ── View All link ───────────────────────────────────────────────────────────

  it('"View All" link renders when more than 5 items', () => {
    const history = Array.from({ length: 6 }, (_, i) => ({
      input: `Prompt ${i + 1}`,
      ts: i,
    }));
    render(<HistorySection history={history} />);
    expect(screen.getByText(/View All/)).toBeInTheDocument();
  });

  // ── Performance / edge cases ────────────────────────────────────────────────

  it('Does not crash with 100 items', () => {
    const history = Array.from({ length: 100 }, (_, i) => ({
      input: `Prompt number ${i + 1}`,
      ts: i,
    }));
    expect(() => render(<HistorySection history={history} />)).not.toThrow();
    expect(screen.getByText('Prompt number 5')).toBeInTheDocument();
  });

  // ── Pinning ─────────────────────────────────────────────────────────────────

  it('Pinned items render above unpinned items', () => {
    const history = [
      { input: 'Older item', ts: 1 },
      { input: 'Newer item', ts: 2 },
    ];
    render(<HistorySection history={history} />);

    const items = screen.getAllByRole('button', { name: /^Load/ });
    const olderItem = items.find(el => el.getAttribute('title') === 'Older item');
    hoverItem(olderItem);

    const pinBtn = screen.getByRole('button', { name: 'Pin prompt' });
    fireEvent.click(pinBtn);

    const allItems = screen.getAllByRole('button', { name: /^Load/ });
    const olderIndex = allItems.findIndex(el => el.getAttribute('title') === 'Older item');
    const newerIndex = allItems.findIndex(el => el.getAttribute('title') === 'Newer item');
    expect(olderIndex).toBeLessThan(newerIndex);
  });

  it('Pinned section label renders when pinned items exist', () => {
    const history = [
      { input: 'Pinned item', ts: 1 },
    ];
    render(<HistorySection history={history} />);

    const items = screen.getAllByRole('button', { name: /^Load/ });
    hoverItem(items[0]);

    const pinBtn = screen.getByRole('button', { name: 'Pin prompt' });
    fireEvent.click(pinBtn);

    expect(screen.getByText('Pinned')).toBeInTheDocument();
  });

  it('Pinned section absent when no pinned items', () => {
    const history = [
      { input: 'Just an item', ts: 1 },
    ];
    render(<HistorySection history={history} />);
    expect(screen.queryByText('Pinned')).not.toBeInTheDocument();
  });

  it('Unpinned section absent when no unpinned items', () => {
    const history = [
      { input: 'Only pinned', ts: 1 },
    ];
    render(<HistorySection history={history} />);

    const items = screen.getAllByRole('button', { name: /^Load/ });
    hoverItem(items[0]);

    const pinBtn = screen.getByRole('button', { name: 'Pin prompt' });
    fireEvent.click(pinBtn);

    const loadButtons = screen.getAllByRole('button', { name: /^Load/ });
    const hasOnlyPinnedItem = loadButtons.every(btn =>
      btn.getAttribute('title') !== 'Only pinned' ||
      btn.closest('.history-item--pinned')
    );
    expect(hasOnlyPinnedItem).toBe(true);
  });

  it('Toggle pin moves item between sections', () => {
    const history = [
      { input: 'Toggle me', ts: 1 },
    ];
    render(<HistorySection history={history} />);

    expect(screen.queryByText('Pinned')).not.toBeInTheDocument();

    const items = screen.getAllByRole('button', { name: /^Load/ });
    hoverItem(items[0]);

    const pinBtn = screen.getByRole('button', { name: 'Pin prompt' });
    fireEvent.click(pinBtn);
    expect(screen.getByText('Pinned')).toBeInTheDocument();

    const unpinBtn = screen.getByRole('button', { name: 'Unpin prompt' });
    fireEvent.click(unpinBtn);
    expect(screen.queryByText('Pinned')).not.toBeInTheDocument();
  });

  it('Warns when pinned count exceeds 50', () => {
    const history = Array.from({ length: 55 }, (_, i) => ({
      input: `Item ${i}`,
      ts: i,
    }));
    render(<HistorySection history={history} />);

    const viewAllBtn = screen.getByText(/View All/);
    fireEvent.click(viewAllBtn);

    const items = screen.getAllByRole('button', { name: /^Load/ });
    for (let i = 0; i < items.length && i < 51; i++) {
      hoverItem(items[i]);
      const pinBtn = screen.queryByRole('button', { name: 'Pin prompt' });
      if (pinBtn) {
        fireEvent.click(pinBtn);
      }
    }

    expect(console.warn).toHaveBeenCalledWith(
      '[HistorySection] Unusual number of pinned items:',
      51
    );
  });

  // ── Search ──────────────────────────────────────────────────────────────────

  it('Filters items by search term (case-insensitive)', () => {
    const history = [
      { input: 'Write a haiku about AI', ts: 1 },
      { input: 'Explain quantum computing', ts: 2 },
      { input: 'Write a poem', ts: 3 },
    ];
    render(<HistorySection history={history} />);

    const searchInput = screen.getByRole('textbox', { name: 'Search history' });
    fireEvent.change(searchInput, { target: { value: 'write' } });
    act(() => { vi.advanceTimersByTime(300); });

    expect(screen.getByText('Write a haiku about AI')).toBeInTheDocument();
    expect(screen.getByText('Write a poem')).toBeInTheDocument();
    expect(screen.queryByText('Explain quantum computing')).not.toBeInTheDocument();
  });

  it('Filtered pinned items stay above filtered unpinned', () => {
    const history = [
      { input: 'Unpinned write', ts: 1 },
      { input: 'Pinned write', ts: 2 },
    ];
    render(<HistorySection history={history} />);

    const items = screen.getAllByRole('button', { name: /^Load/ });
    const pinnedItem = items.find(el => el.getAttribute('title') === 'Pinned write');
    hoverItem(pinnedItem);

    const pinBtn = screen.getByRole('button', { name: 'Pin prompt' });
    fireEvent.click(pinBtn);

    const searchInput = screen.getByRole('textbox', { name: 'Search history' });
    fireEvent.change(searchInput, { target: { value: 'write' } });
    act(() => { vi.advanceTimersByTime(300); });

    const allItems = screen.getAllByRole('button', { name: /^Load/ });
    const pinnedIndex = allItems.findIndex(el => el.getAttribute('title') === 'Pinned write');
    const unpinnedIndex = allItems.findIndex(el => el.getAttribute('title') === 'Unpinned write');
    expect(pinnedIndex).toBeLessThan(unpinnedIndex);
  });

  it('Shows no-results state when filter returns empty', () => {
    const history = [
      { input: 'Write a haiku', ts: 1 },
    ];
    render(<HistorySection history={history} />);

    const searchInput = screen.getByRole('textbox', { name: 'Search history' });
    fireEvent.change(searchInput, { target: { value: 'nonexistent term' } });
    act(() => { vi.advanceTimersByTime(300); });

    expect(screen.getByText('No prompts match your search')).toBeInTheDocument();
    expect(screen.queryByText('Write a haiku')).not.toBeInTheDocument();
  });

  it('Clearing search restores full list', () => {
    const history = [
      { input: 'Write a haiku', ts: 1 },
      { input: 'Explain quantum', ts: 2 },
    ];
    render(<HistorySection history={history} />);

    const searchInput = screen.getByRole('textbox', { name: 'Search history' });
    fireEvent.change(searchInput, { target: { value: 'write' } });
    act(() => { vi.advanceTimersByTime(300); });

    expect(screen.queryByText('Explain quantum')).not.toBeInTheDocument();

    const clearBtn = screen.getByRole('button', { name: 'Clear search' });
    fireEvent.click(clearBtn);

    expect(screen.getByText('Write a haiku')).toBeInTheDocument();
    expect(screen.getByText('Explain quantum')).toBeInTheDocument();
  });

  it('Special regex chars in search do not throw', () => {
    const history = [
      { input: 'What is 2+2?', ts: 1 },
      { input: 'Explain .* patterns', ts: 2 },
    ];
    render(<HistorySection history={history} />);

    const searchInput = screen.getByRole('textbox', { name: 'Search history' });
    expect(() => {
      fireEvent.change(searchInput, { target: { value: '2+2' } });
      fireEvent.change(searchInput, { target: { value: '.*' } });
      fireEvent.change(searchInput, { target: { value: '[test]' } });
    }).not.toThrow();
  });

  it('Search hidden in collapsed sidebar state', () => {
    mockUseSidebar.mockReturnValue(true);
    const history = [{ input: 'Some prompt', ts: 1 }];
    const { container } = render(<HistorySection history={history} />);

    expect(container.querySelector('.history-section')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Search history' })).not.toBeInTheDocument();
  });

  it('Null history array shows no-results, not crash', () => {
    expect(() => render(<HistorySection history={null} />)).not.toThrow();
    expect(screen.getByText('No history yet')).toBeInTheDocument();
  });
});
