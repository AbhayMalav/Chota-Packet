import { useState, useCallback, useEffect, useRef } from 'react'
import { LS_PINNED, MAX_PINNED } from '../constants'

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadPinned() {
  try {
    const raw = localStorage.getItem(LS_PINNED)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    // Guard against corrupted storage values
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function savePinned(items) {
  try {
    localStorage.setItem(LS_PINNED, JSON.stringify(items))
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[usePinned] Failed to write to localStorage:', err)
    }
  }
}

function isValidEntry(entry) {
  return (
    entry !== null &&
    entry !== undefined &&
    typeof entry === 'object' &&
    typeof entry.ts === 'number' &&
    typeof entry.enhanced === 'string'
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Manages a persisted list of pinned prompt entries.
 * Pins are capped at MAX_PINNED and persisted to localStorage under LS_PINNED.
 * Deduplication is by `ts` (timestamp) - consistent with HistoryPanel.
 *
 * @returns {{ pinned: object[], pin: (entry: object) => void, unpin: (ts: number) => void }}
 */
export default function usePinned() {
  const [pinned, setPinned] = useState(loadPinned)
  const isFirstRender = useRef(true)
  const debounceTimer = useRef(null)

  // Persist to localStorage on change - skip initial mount to avoid
  // overwriting a valid stored value with the just-loaded state
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // Debounce writes - rapid pin/unpin actions only trigger one write
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => savePinned(pinned), 300)

    return () => clearTimeout(debounceTimer.current)
  }, [pinned])

  const pin = useCallback((entry) => {
    if (!isValidEntry(entry)) {
      if (import.meta.env.DEV) {
        console.warn('[usePinned] pin() received an invalid entry:', entry)
      }
      return
    }

    setPinned((prev) => {
      if (prev.length >= MAX_PINNED) return prev
      // Deduplicate by ts - two entries with the same timestamp are the same item
      if (prev.some((p) => p.ts === entry.ts)) return prev
      return [entry, ...prev]
    })
  }, [])

  // unpin takes ts (number) as the unique key - not enhanced text
  const unpin = useCallback((ts) => {
    if (typeof ts !== 'number') {
      if (import.meta.env.DEV) {
        console.warn('[usePinned] unpin() expected a numeric ts, got:', ts)
      }
      return
    }
    setPinned((prev) => prev.filter((p) => p.ts !== ts))
  }, [])

  return { pinned, pin, unpin }
}
