import React, { useMemo } from 'react'
import { diff_match_patch } from 'diff-match-patch'
import { XIcon } from './icons'


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
        <h3 className="text-theme text-sm font-semibold">
          Changes
        </h3>
        <button
          className="btn-icon"
          onClick={onClose}
          aria-label="Close diff view"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="text-secondary flex items-center gap-4 text-xs">
        <span><span className="diff-added px-1">added</span></span>
        <span><span className="diff-removed px-1">removed</span></span>
      </div>

      {/* Diff content */}
      <div className="text-theme text-sm leading-relaxed">
        {diffs.length === 0 && (
          <p className="text-muted">
            Nothing to compare yet.
          </p>
        )}

        {noDifferences && (
          <p className="text-muted">
            No differences — the texts are identical.
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
