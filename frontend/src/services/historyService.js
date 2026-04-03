import { HISTORY_LIMIT } from '../config/constants';

/**
 * Appends a new prompt to the history list, respecting the incognito mode flag.
 *
 * @param {Array} currentHistory - The current array of history items.
 * @param {Object} newItem - The new history entry to append ({ input, enhanced, ts }).
 * @param {boolean} isIncognito - The context flag indicating if incognito mode is active.
 * @returns {Array} The updated array of history items.
 */
export function appendHistoryItem(currentHistory, newItem, isIncognito) {
  if (isIncognito === undefined) {
    console.warn('[historyService] isIncognito flag not provided, defaulting to false (writing).');
    isIncognito = false;
  }

  // S-06: Do not store any history if incognito is active
  if (isIncognito) {
    return currentHistory;
  }

  return [
    newItem,
    ...currentHistory.slice(0, HISTORY_LIMIT - 1)
  ];
}
