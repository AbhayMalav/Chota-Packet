import React from 'react'
import { useRecorder } from '../hooks/useRecorder'

export default function MicButton({ onTranscript, lang }) {
  const { recording, error, start, stop } = useRecorder({ onTranscript, lang })

  return (
    <div className="flex flex-col items-end gap-1">
            <button
        onClick={recording ? stop : start}
        aria-label={recording ? 'Stop recording' : 'Start voice input'}
        title={recording ? 'Stop recording' : 'Start voice input'}
        style={{ willChange: 'transform' }}
        className={`btn-icon${recording ? ' mic-active animate-mic-pulse' : ''}`}
      >
        {recording ? '⏹ Stop' : '🎤 Mic'}
      </button>
      {error && <span className="text-[11px] text-red-400 max-w-[180px] text-right">{error}</span>}
    </div>
  )
}
