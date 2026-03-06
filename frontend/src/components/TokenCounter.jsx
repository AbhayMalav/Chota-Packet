import React from 'react'
import { estimateTokens } from '../constants'

const MAX_TOKENS = 512

export default function TokenCounter({ text }) {
  const tokens = estimateTokens(text)
  const pct = Math.min((tokens / MAX_TOKENS) * 100, 100)
  const barColor = pct > 80
    ? 'bg-red-500'
    : pct > 60
      ? 'bg-amber-400'
      : 'gradient-brand'

  return (
    <div className="flex items-center gap-2.5" title={`~${tokens} tokens (estimated)`}>
      <div className="w-20 h-1.5 rounded-full bg-gray-200/80 dark:bg-gray-700/60 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
             style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium tabular-nums">
        ~{tokens} tokens
      </span>
    </div>
  )
}
