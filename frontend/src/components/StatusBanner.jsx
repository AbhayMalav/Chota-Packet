import React from 'react'

export default function StatusBanner({ status }) {
  const configs = {
    ok: {
      dot: 'bg-emerald-400',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/6',
      msg: 'Backend connected - ready to enhance',
      pulse: true,
    },
    loading: {
      dot: 'bg-amber-400',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      bg: 'bg-amber-500/6',
      msg: 'Connecting to backend…',
      pulse: true,
    },
    error: {
      dot: 'bg-red-500',
      text: 'text-red-400',
      border: 'border-red-500/20',
      bg: 'bg-red-500/6',
      msg: 'Backend offline - run: uvicorn main:app --reload',
      pulse: false,
    },
  }
  const c = configs[status] ?? configs.loading

  return (
    <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full border text-xs font-medium
                     backdrop-blur-sm ${c.bg} ${c.border} ${c.text} animate-fade-in`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot} ${c.pulse ? 'animate-dot-pulse' : ''}`} />
      <span>{c.msg}</span>
    </div>
  )
}
