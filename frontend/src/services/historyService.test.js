import { describe, it, expect, vi } from 'vitest';
import { appendHistoryItem } from './historyService';

// Mock config constants
vi.mock('../config/constants', () => ({
  HISTORY_LIMIT: 3
}));

describe('historyService', () => {
  const currentHistory = [
    { input: 'test 1', enhanced: 'enhanced 1', ts: 1000 },
    { input: 'test 2', enhanced: 'enhanced 2', ts: 2000 }
  ];
  const newItem = { input: 'new test', enhanced: 'new enhanced', ts: 3000 };

  it('Does not write history when isIncognito is true', () => {
    const nextHistory = appendHistoryItem(currentHistory, newItem, true);
    expect(nextHistory).toBe(currentHistory); // Returns the exact same reference
    expect(nextHistory.length).toBe(2);
  });

  it('Writes history normally when isIncognito is false', () => {
    const nextHistory = appendHistoryItem(currentHistory, newItem, false);
    expect(nextHistory).not.toBe(currentHistory);
    expect(nextHistory.length).toBe(3);
    expect(nextHistory[0]).toBe(newItem);
    expect(nextHistory[1]).toStrictEqual(currentHistory[0]);
    expect(nextHistory[2]).toStrictEqual(currentHistory[1]);
  });
  
  it('Respects the HISTORY_LIMIT when adding items', () => {
    // Current history has 2 items. History limit is mocked to 3.
    // If we have 3 items, adding 1 more should drop the oldest.
    const fullHistory = [
      { input: '1', enhanced: '1', ts: 100 },
      { input: '2', enhanced: '2', ts: 200 },
      { input: '3', enhanced: '3', ts: 300 }
    ];
    
    const nextHistory = appendHistoryItem(fullHistory, newItem, false);
    expect(nextHistory.length).toBe(3); // capped at 3
    expect(nextHistory[0]).toBe(newItem);
    expect(nextHistory[2]).toStrictEqual(fullHistory[1]); // the oldest (fullHistory[2]) is dropped
  });

  it('Defaults to writing and warns if isIncognito is undefined', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const nextHistory = appendHistoryItem(currentHistory, newItem, undefined);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      '[historyService] isIncognito flag not provided, defaulting to false (writing).'
    );
    expect(nextHistory.length).toBe(3);
    
    consoleSpy.mockRestore();
  });
});
