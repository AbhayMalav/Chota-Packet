import React from 'react'

export function NavBtn({ onClick, label, icon }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="p-2 rounded-xl text-gray-500 hover:text-purple-400
                 hover:bg-purple-500/10 transition-all duration-200"
    >
      {icon}
    </button>
  )
}

export function KbdHint({ keys, action }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px]">
      <kbd className="border border-gray-700/80 rounded-md px-1.5 py-0.5
                      bg-gray-800/50 text-[10px] font-mono text-gray-500">
        {keys}
      </kbd>
      <span className="text-gray-600">{action}</span>
    </span>
  )
}
