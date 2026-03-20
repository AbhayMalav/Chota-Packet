import React, { useState, useCallback } from 'react'
import { LS_FEEDBACK, FEEDBACK_CAP } from '../constants'

export default function FeedbackBar() {
  const [voted, setVoted] = useState(null) // 'up' | 'down' | null

  const vote = useCallback((v) => {
    // No-op if the user clicks the same vote again
    if (voted === v) return

    setVoted(v)

    try {
      const raw = localStorage.getItem(LS_FEEDBACK)
      let stored = []

      try {
        const parsed = JSON.parse(raw || '[]')
        stored = Array.isArray(parsed) ? parsed : []
      } catch {
        console.warn('[FeedbackBar] Corrupted feedback data in localStorage — resetting.')
        stored = []
      }

      // If user is switching their vote, replace the last entry instead of appending
      if (voted !== null && stored.length > 0) {
        stored[stored.length - 1] = { v, ts: Date.now() }
      } else if (stored.length < FEEDBACK_CAP) {
        stored.push({ v, ts: Date.now() })
      }

      localStorage.setItem(LS_FEEDBACK, JSON.stringify(stored))
    } catch (err) {
      console.warn('[FeedbackBar] Failed to persist feedback to localStorage:', err)
    }
  }, [voted])

  return (
    <div className="flex items-center gap-3 mt-3">
      <span className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
        Was this enhancement helpful?
      </span>

      <div className="flex items-center gap-1">
        <button
          className="btn-icon"
          aria-label="Thumbs up"
          aria-pressed={voted === 'up'}
          onClick={() => vote('up')}
          style={voted === 'up' ? { color: '#a855f7' } : undefined}
        >
          👍
        </button>

        <button
          className="btn-icon"
          aria-label="Thumbs down"
          aria-pressed={voted === 'down'}
          onClick={() => vote('down')}
          style={voted === 'down' ? { color: '#a855f7' } : undefined}
        >
          👎
        </button>
      </div>

      {/* Confirmation — only shown after a vote is cast */}
      {voted !== null && (
        <span
          className="text-xs animate-fade-in"
          style={{ color: 'var(--theme-text-secondary)' }}
        >
          Thanks for your feedback!
        </span>
      )}
    </div>
  )
}
