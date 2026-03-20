import React, { useMemo } from 'react'
import { diff_match_patch } from 'diff-match-patch'

// diff operation constants
const DIFF_DELETE = -1
const DIFF_INSERT = 1
const DIFF_EQUAL = 0

export default function DiffView({ original, enhanced, onClose }) {
  const diffs = useMemo(() => {
    if (!original || !enhanced) return []

    try {
      const dmp = new diff_match_patch()
      // Coerce to string defensively - prevents library throw on non-string props
      const result = dmp.diff_main(String(original), String(enhanced))
      // Semantic cleanup: converts noisy char-level diffs to readable word-level diffs
      dmp.diff_cleanupSemantic(result)
      return result
    } catch (err) {
      console.warn('[DiffView] Failed to compute diff:', err)
      return []
    }
  }, [original, enhanced])

  const noDifferences = diffs.length > 0 && diffs.every(([op]) => op === DIFF_EQUAL)

  return (
    <div
      role="region"
      aria-label="Prompt diff view"
      className="glass-card rounded-2xl p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>
          Changes
        </h3>
        <button
          className="btn-icon"
          onClick={onClose}
          aria-label="Close diff view"
        >
          ✕
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
        <span><span className="diff-added px-1">added</span></span>
        <span><span className="diff-removed px-1">removed</span></span>
      </div>

      {/* Diff content */}
      <div className="text-sm leading-relaxed" style={{ color: 'var(--theme-text)' }}>
        {diffs.length === 0 && (
          <p style={{ color: 'var(--theme-text-muted)' }}>
            Nothing to compare yet.
          </p>
        )}

        {noDifferences && (
          <p style={{ color: 'var(--theme-text-muted)' }}>
            No differences - the texts are identical.
          </p>
        )}

        {diffs.length > 0 && !noDifferences && diffs.map(([op, text], i) => {
          if (op === DIFF_EQUAL) return <span key={i}>{text}</span>
          if (op === DIFF_INSERT) return <span key={i} className="diff-added">{text}</span>
          if (op === DIFF_DELETE) return <span key={i} className="diff-removed">{text}</span>
          return null
        })}
      </div>
    </div>
  )
}
