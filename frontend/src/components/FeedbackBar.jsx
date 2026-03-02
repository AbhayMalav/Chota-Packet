import React, { useState, useCallback } from 'react'
import { LS_FEEDBACK, FEEDBACK_CAP } from '../constants'

export default function FeedbackBar() {
  const [voted, setVoted] = useState(null) // 'up' | 'down' | null

  const vote = useCallback((v) => {
    setVoted(v)
    try {
      const stored = JSON.parse(localStorage.getItem(LS_FEEDBACK) || '[]')
      if (stored.length < FEEDBACK_CAP) {
        stored.push({ v, ts: Date.now() })
        localStorage.setItem(LS_FEEDBACK, JSON.stringify(stored))
      }
    } catch {}
  }, [])

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Feedback">
      <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">Helpful?</span>
      {[['up', '👍'], ['down', '👎']].map(([v, emoji]) => (
        <button
          key={v}
          onClick={() => vote(v)}
          aria-label={v === 'up' ? 'Thumbs up' : 'Thumbs down'}
          aria-pressed={voted === v}
          className={`text-sm transition-transform hover:scale-110 active:scale-95
                      ${voted === v ? 'grayscale-0 opacity-100' : 'grayscale opacity-40 hover:opacity-70'}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
