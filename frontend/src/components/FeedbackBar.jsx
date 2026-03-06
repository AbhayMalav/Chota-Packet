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
    <div className="flex items-center gap-1.5" role="group" aria-label="Feedback">
      <span className="text-[11px] text-gray-400 dark:text-gray-500 mr-1 font-medium">Helpful?</span>
      {[['up', '👍'], ['down', '👎']].map(([v, emoji]) => (
        <button
          key={v}
          onClick={() => vote(v)}
          aria-label={v === 'up' ? 'Thumbs up' : 'Thumbs down'}
          aria-pressed={voted === v}
          className={`text-sm transition-all duration-200 hover:scale-125 active:scale-95
                      rounded-md p-0.5
                      ${voted === v
                        ? 'grayscale-0 opacity-100 ring-2 ring-violet-500/30'
                        : 'grayscale opacity-30 hover:opacity-70 hover:grayscale-0'}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
