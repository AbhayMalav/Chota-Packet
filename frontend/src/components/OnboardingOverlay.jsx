import React, { useEffect, useRef } from 'react'
import { LS_ONBOARDED } from '../constants'

const FEATURES = [
  {
    icon: '🏠',
    title: 'Local Inference',
    desc: 'No data leaves your device. Works fully offline with Ollama.',
    color: 'emerald',
  },
  {
    icon: '✨',
    title: 'AI Enhancement',
    desc: 'Transform rough ideas into polished, powerful prompts instantly.',
    color: 'purple',
  },
  {
    icon: '🌐',
    title: 'Multi-language',
    desc: 'Input and output in 10+ languages including Hindi, Spanish, French.',
    color: 'blue',
  },
]

// /10 is the lowest standard Tailwind opacity step - avoids missing utility classes
const COLOR_MAP = {
  emerald: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-400', iconBg: 'bg-emerald-500/15' },
  purple: { border: 'border-purple-500/20', bg: 'bg-purple-500/10', text: 'text-purple-400', iconBg: 'bg-purple-500/15' },
  blue: { border: 'border-blue-500/20', bg: 'bg-blue-500/10', text: 'text-blue-400', iconBg: 'bg-blue-500/15' },
}

export default function OnboardingOverlay({ onDone = () => { } }) {
  const dialogRef = useRef(null)
  const primaryBtnRef = useRef(null)

  const finish = (skipped = false) => {
    try {
      localStorage.setItem(LS_ONBOARDED, '1')
    } catch (err) {
      // Storage failure (private browsing, quota) - overlay still closes
      if (import.meta.env.DEV) {
        console.warn('[OnboardingOverlay] Could not persist onboarded state:', err)
      }
    }
    onDone(skipped)
  }

  // ── Focus trap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // Move focus to the primary CTA when the dialog opens
    primaryBtnRef.current?.focus()

    const dialog = dialogRef.current
    if (!dialog) return

    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ')

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        finish(true)
        return
      }

      if (e.key !== 'Tab') return

      const focusable = Array.from(dialog.querySelectorAll(focusableSelectors))
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        // Shift+Tab: wrap from first → last
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        // Tab: wrap from last → first
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    dialog.addEventListener('keydown', handleKeyDown)
    return () => dialog.removeEventListener('keydown', handleKeyDown)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center glass-overlay animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Chota Packet"
      ref={dialogRef}
    >
      {/* Decorative nebula orbs - reuse global classes to stay in sync with design system */}
      <div aria-hidden="true" className="pointer-events-none">
        <div className="nebula-orb-1" />
        <div className="nebula-orb-2" />
      </div>

      {/* Card */}
      <div
        className="relative rounded-2xl max-w-sm w-full mx-4 p-8 text-center animate-fade-in gradient-border"
        style={{
          background: 'rgba(17,17,32,0.96)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(127,19,236,0.22)',
        }}
      >
        {/* Inner glow */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ boxShadow: 'inset 0 0 80px rgba(127,19,236,0.06)' }}
          aria-hidden="true"
        />

        {/* Icon */}
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 animate-float"
          style={{
            background: 'radial-gradient(circle at center, rgba(127,19,236,0.25) 0%, rgba(127,19,236,0.05) 70%)',
            border: '1px solid rgba(127,19,236,0.2)',
          }}
          aria-hidden="true"
        >
          <span className="text-5xl">✨</span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-extrabold gradient-text mb-1 tracking-tight">
          Welcome to Chota Packet
        </h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Edge AI Prompt Enhancer - running locally on your device
        </p>

        {/* Feature highlights */}
        <div className="flex flex-col gap-2.5 text-left mb-7">
          {FEATURES.map(({ icon, title, desc, color }) => {
            const c = COLOR_MAP[color] ?? {}
            return (
              <div
                key={title}
                className={`flex items-start gap-3 p-3 rounded-xl border ${c.border ?? ''} ${c.bg ?? ''}`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${c.iconBg ?? ''}`}
                  aria-hidden="true"
                >
                  <span className="text-base">{icon}</span>
                </div>
                <div>
                  <p className={`text-xs font-bold ${c.text ?? ''}`}>{title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA - separated from Skip so they can be distinguished analytically */}
        <button
          ref={primaryBtnRef}
          onClick={() => finish(false)}
          className="w-full py-3 rounded-full gradient-brand text-white font-bold text-sm tracking-wide
                     shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/45
                     hover:brightness-110 active:scale-[0.98] transition-all duration-200"
        >
          Get Started →
        </button>
        <button
          onClick={() => finish(true)}
          className="mt-3 text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
