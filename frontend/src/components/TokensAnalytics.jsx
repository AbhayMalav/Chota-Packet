import React from 'react'
import './TokensAnalytics.css'

// Safely coerce a value to a finite number, with a dev warning if it isn't
function safeNum(val, fieldName) {
  if (Number.isFinite(val)) return val
  if (import.meta.env.DEV) {
    console.warn(`[TokensAnalytics] Expected finite number for "${fieldName}", got:`, val)
  }
  return 0
}

// Format cost: show 4 decimal places for micro-costs, 2 for normal values
function formatCost(val) {
  return val > 0 && val < 0.01
    ? val.toFixed(4)
    : val.toFixed(2)
}

export default function TokensAnalytics({ stats }) {
  // Guard on stats object only - don't hide component just because totalPrompts is 0
  if (!stats) return null

  const totalTokensSaved = safeNum(stats.totalTokensSaved, 'totalTokensSaved')
  const estimatedCostSaved = safeNum(stats.estimatedCostSaved, 'estimatedCostSaved')
  const totalPrompts = safeNum(stats.totalPrompts, 'totalPrompts')
  const efficiencyScore = safeNum(stats.efficiencyScore, 'efficiencyScore')
  const grade = stats.grade || 'N/A'

  return (
    <section className="tokens-analytics" aria-label="Token savings analytics">
      <h3 className="analytics-title">Tokens Saved Analytics</h3>
      <div className="analytics-grid">

        <div
          className="stat-card"
          aria-label={`${totalTokensSaved.toLocaleString()} Tokens Saved`}
        >
          <span className="stat-value">{totalTokensSaved.toLocaleString()}</span>
          <span className="stat-label" aria-hidden="true">Tokens Saved</span>
        </div>

        <div
          className="stat-card"
          aria-label={`$${formatCost(estimatedCostSaved)} Cost Saved`}
        >
          <span className="stat-value">${formatCost(estimatedCostSaved)}</span>
          <span className="stat-label" aria-hidden="true">Cost Saved</span>
        </div>

        <div
          className="stat-card"
          aria-label={`${totalPrompts} Prompts Improved`}
        >
          <span className="stat-value">{totalPrompts.toLocaleString()}</span>
          <span className="stat-label" aria-hidden="true">Prompts Improved</span>
        </div>

        <div
          className="stat-card accent"
          aria-label={`Grade ${grade}, Efficiency ${efficiencyScore}%`}
        >
          <span className="stat-value grade" aria-hidden="true">{grade}</span>
          <span className="stat-label" aria-hidden="true">Efficiency ({efficiencyScore}%)</span>
        </div>

      </div>
    </section>
  )
}
