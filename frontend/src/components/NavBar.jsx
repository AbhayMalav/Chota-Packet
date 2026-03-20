import React from 'react'

export function NavBtn({ onClick, label, icon, active = false }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`btn-icon${active ? ' active' : ''}`}
    >
      <span className="w-5 h-5 flex items-center justify-center pointer-events-none">
        {icon}
      </span>
    </button>
  )
}

export function KbdHint({ keys, action }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-[var(--theme-text-secondary)]">
      <kbd className="px-1.5 py-0.5 rounded text-[0.7rem] font-mono font-semibold bg-[var(--theme-kbd-bg)] border border-[var(--theme-kbd-border)]">
        {keys}
      </kbd>
      <span>{action}</span>
    </div>
  )
}
