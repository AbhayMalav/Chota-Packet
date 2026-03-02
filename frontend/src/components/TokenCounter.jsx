import React from 'react'
import { estimateTokens } from '../constants'

const MAX_TOKENS = 512

export default function TokenCounter({ text }) {
  const tokens = estimateTokens(text)
  const pct = Math.min((tokens / MAX_TOKENS) * 100, 100)
  const color = pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-amber-400' : 'bg-violet-500'

  return (
    <div className="flex items-center gap-2" title={`~${tokens} tokens (estimated)`}>
      <div className="w-20 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 dark:text-gray-500">~{tokens} tokens</span>
    </div>
  )
}
