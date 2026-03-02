import React, { useMemo } from 'react'
import { diff_match_patch } from 'diff-match-patch'

const dmp = new diff_match_patch()

export default function DiffView({ original, enhanced, onClose }) {
  const diffs = useMemo(() => {
    if (!original || !enhanced) return []
    return dmp.diff_main(original, enhanced)
  }, [original, enhanced])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
         role="dialog" aria-modal="true" aria-label="Prompt comparison">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl
                      max-w-2xl w-full mx-4 p-6 flex flex-col gap-4 max-h-[80vh]">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Before / After</h2>
          <button onClick={onClose} aria-label="Close diff view"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">✕</button>
        </div>

        <div className="overflow-y-auto text-sm leading-relaxed font-mono whitespace-pre-wrap break-words
                        bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          {diffs.map(([op, text], i) => {
            if (op === 1) return <span key={i} className="diff-added">{text}</span>
            if (op === -1) return <span key={i} className="diff-removed">{text}</span>
            return <span key={i}>{text}</span>
          })}
        </div>

        <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span><span className="diff-added px-1">Green</span> = added</span>
          <span><span className="diff-removed px-1">Red</span> = removed</span>
        </div>
      </div>
    </div>
  )
}
