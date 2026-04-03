import React from 'react'
import { PlugIcon, GlobeIcon } from '../../ui/icons'


// ── NavBtn ────────────────────────────────────────────────────────────────────
export function NavBtn({ onClick = () => { }, label, icon: Icon, active }) {
  if (import.meta.env.DEV && !Icon) {
    console.warn(`[NavBtn] No icon provided for button: "${label}"`)
  }

  // aria-pressed only applies to toggle buttons.
  // When active is not passed at all, omit aria-pressed so modal-openers
  // (e.g. Settings) are not misread as toggles by screen readers.
  const ariaPressed = active !== undefined ? active : undefined

  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={ariaPressed}
      title={label}
      className={`btn-icon${active ? ' active' : ''}`}
    >
      <span className="w-5 h-5 flex items-center justify-center">
        {Icon && <Icon />}
      </span>
    </button>
  )
}


// ── KbdHint ───────────────────────────────────────────────────────────────────
export function KbdHint({ keys, action }) {
  // Render nothing if either prop is missing
  if (!keys || !action) return null

  // Support both a single string ("Ctrl+K") and an array (["Ctrl", "K"])
  const keyList = Array.isArray(keys) ? keys : [keys]

  return (
    <div className="text-secondary flex items-center gap-1.5 text-xs">
      <span className="flex items-center gap-1">
        {keyList.map((key, i) => (
          <React.Fragment key={key}>
            {i > 0 && <span className="opacity-50">+</span>}
            <kbd className="kbd px-1.5 py-0.5 rounded text-[0.7rem] font-mono font-semibold">
              {key}
            </kbd>
          </React.Fragment>
        ))}
      </span>
      <span>{action}</span>
    </div>
  )
}

// ── ModeIndicator ─────────────────────────────────────────────────────────────
export function ModeIndicator({ mode = 'cloud' }) {
  const isCloud = mode === 'cloud'

  const label = isCloud ? 'Cloud' : 'Local'
  const Icon = isCloud ? GlobeIcon : PlugIcon

  const title = isCloud
    ? 'Enhancements are being routed through cloud AI'
    : 'Enhancements are being processed locally on your device'

  // Amber for Local, Blue/Teal for Cloud
  const colorClasses = isCloud
    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_12px_-3px_rgba(59,130,246,0.3)]'
    : 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_12px_-3px_rgba(245,158,11,0.3)]'

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold tracking-wide animate-fade-in transition-all duration-300 ${colorClasses}`}
      title={title}
      aria-label={`Enhancement mode: ${label}`}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="hidden sm:inline uppercase">{label}</span>
    </div>
  )
}
