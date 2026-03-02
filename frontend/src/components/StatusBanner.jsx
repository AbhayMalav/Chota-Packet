import React from 'react'

export default function StatusBanner({ status }) {
  // status: 'ok' | 'loading' | 'error'
  const configs = {
    ok: {
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      dot: 'bg-emerald-400',
      text: 'text-emerald-700 dark:text-emerald-300',
      msg: 'Backend connected — ready to enhance',
    },
    loading: {
      bg: 'bg-amber-500/10 border-amber-500/30',
      dot: 'bg-amber-400 animate-pulse',
      text: 'text-amber-700 dark:text-amber-300',
      msg: 'Connecting to backend…',
    },
    error: {
      bg: 'bg-red-500/10 border-red-500/30',
      dot: 'bg-red-400',
      text: 'text-red-700 dark:text-red-300',
      msg: 'Backend offline — start with: uvicorn main:app --reload --port 8000',
    },
  }
  const c = configs[status] ?? configs.loading

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
      {c.msg}
    </div>
  )
}
