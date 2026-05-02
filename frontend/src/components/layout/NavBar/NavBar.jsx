import React from 'react'
import { PlugIcon, GlobeIcon } from '../../ui/icons'
import './NavBar.css'


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

  const variantClass = isCloud ? 'mode-indicator--cloud' : 'mode-indicator--local'

  return (
    <div
      className={`mode-indicator ${variantClass}`}
      title={title}
      aria-label={`Enhancement mode: ${label}`}
    >
      <Icon className="mode-indicator__icon" />
      <span className="hidden sm:inline uppercase">{label}</span>
    </div>
  )
}
