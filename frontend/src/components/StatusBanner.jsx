import React, { useState } from 'react'

// Module-level constant — never recreated on re-render
const CONFIGS = {
  ok: {
    dot:    'bg-emerald-400',
    text:   'text-emerald-400',
    border: 'border-emerald-500/20',
    bg:     'bg-emerald-500/5',       // fixed: /6 is non-standard, /5 is the lowest Tailwind step
    msg:    'Backend connected — ready to enhance',
    pulse:  true,
  },
  loading: {
    dot:    'bg-amber-400',
    text:   'text-amber-400',
    border: 'border-amber-500/20',
    bg:     'bg-amber-500/5',         // fixed: /6 → /5
    msg:    'Connecting to backend…',
    pulse:  true,
  },
  error: {
    dot:    'bg-red-500',
    text:   'text-red-400',
    border: 'border-red-500/20',
    bg:     'bg-red-500/5',           // fixed: /6 → /5
    msg:    'Backend offline — run: uvicorn main:app --reload',
    pulse:  false,
  },
}

export default function StatusBanner({ status }) {
  const [dismissed, setDismissed] = useState(false)

  // Warn in dev if an unrecognised status is passed
  if (import.meta.env.DEV && status && !(status in CONFIGS)) {
    console.warn(`[StatusBanner] Unrecognised status: "${status}" — falling back to "loading"`)
  }

  const c = CONFIGS[status] ?? CONFIGS.loading

  // Allow user to dismiss persistent error banner
  if (dismissed && status === 'error') return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`Backend status: ${c.msg}`}
      className={`flex items-center gap-2.5 px-4 py-2 rounded-full border text-xs font-medium
                  backdrop-blur-sm ${c.bg} ${c.border} ${c.text} animate-fade-in`}
    >
      {/* Decorative pulse dot — hidden from accessibility tree */}
      <span
        aria-hidden="true"
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}${c.pulse ? ' animate-dot-pulse' : ''}`}
      />

      <span>{c.msg}</span>

      {/* Dismiss button — only shown on persistent error state */}
      {status === 'error' && (
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss backend error banner"
          className="ml-1 opacity-50 hover:opacity-100 transition-opacity text-xs leading-none"
        >
          ✕
        </button>
      )}
    </div>
  )
}
