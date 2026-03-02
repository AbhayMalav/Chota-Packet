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
        title={recording ? 'Stop recording' : 'Record audio (FR-03)'}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition
                    ${recording
                      ? 'bg-red-500 text-white animate-mic-pulse shadow-red-500/30 shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
      >
        {recording ? '⏹ Stop' : '🎤 Mic'}
      </button>
      {error && <span className="text-xs text-red-500 max-w-[180px] text-right">{error}</span>}
    </div>
  )
}
