import React from 'react'
import { useRecorder } from '../hooks/useRecorder'

export default function MicButton({ onTranscript, lang }) {
  const { recording, error, start, stop } = useRecorder({ onTranscript, lang })

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        id="mic-btn"
        onClick={recording ? stop : start}
        aria-label={recording ? 'Stop recording' : 'Start recording'}
        title={recording ? 'Stop recording' : 'Record audio'}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                    transition-all duration-200
                    ${recording
                      ? 'bg-red-500/90 text-white animate-mic-pulse shadow-lg shadow-red-500/30'
                      : 'border border-purple-500/20 bg-purple-500/5 text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/35'}`}
      >
        {recording ? '⏹ Stop' : '🎤 Mic'}
      </button>
      {error && <span className="text-[11px] text-red-400 max-w-[180px] text-right">{error}</span>}
    </div>
  )
}
