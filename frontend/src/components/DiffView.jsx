import React, { useMemo } from 'react'
import { diff_match_patch } from 'diff-match-patch'

const dmp = new diff_match_patch()

export default function DiffView({ original, enhanced, onClose }) {
  const diffs = useMemo(() => {
    if (!original || !enhanced) return []
    return dmp.diff_main(original, enhanced)
  }, [original, enhanced])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass-overlay animate-fade-in"
         role="dialog" aria-modal="true" aria-label="Prompt comparison">
      <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl
                      shadow-2xl shadow-violet-500/10 max-w-2xl w-full mx-4 p-6
                      flex flex-col gap-4 max-h-[80vh] gradient-border animate-fade-in
                      border border-white/20 dark:border-gray-700/30">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span className="text-violet-500">📊</span>
            Before / After
          </h2>
          <button onClick={onClose} aria-label="Close diff view"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                             hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 text-lg">
            ✕
          </button>
        </div>

        {/* Diff content */}
        <div className="overflow-y-auto text-sm leading-relaxed font-mono whitespace-pre-wrap break-words
                        bg-gray-50/80 dark:bg-gray-800/60 rounded-xl p-4 backdrop-blur-sm
                        border border-gray-200/50 dark:border-gray-700/30">
          {diffs.map(([op, text], i) => {
            if (op === 1) return <span key={i} className="diff-added">{text}</span>
            if (op === -1) return <span key={i} className="diff-removed">{text}</span>
            return <span key={i}>{text}</span>
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
          <span><span className="diff-added px-1.5 mr-1">Green</span> = added</span>
          <span><span className="diff-removed px-1.5 mr-1">Red</span> = removed</span>
        </div>
      </div>
    </div>
  )
}
