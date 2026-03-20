import React, { useState } from 'react'
import { useRecorder } from '../hooks/useRecorder'

export default function MicButton({ onTranscript = () => {}, lang }) {
  const { recording, error, start, stop } = useRecorder({ onTranscript, lang })
  const [starting, setStarting] = useState(false)

  const handleClick = async () => {
    if (recording) {
      stop()
      return
    }
    // Disable button during the permission prompt / start-up window
    setStarting(true)
    try {
      await start()
    } finally {
      setStarting(false)
    }
  }

  // Safely coerce error to a displayable string regardless of type
  const errorMessage = error
    ? (error instanceof Error ? error.message : String(error))
    : null

  const isDisabled = starting && !recording
  const label = starting
    ? 'Starting…'
    : recording
    ? 'Stop recording'
    : 'Start voice input'

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        aria-label={label}
        title={label}
        style={{
          // willChange scoped to animation only — avoids permanent GPU layer waste
          willChange: recording ? 'transform' : 'auto',
        }}
        className={`btn-icon${recording ? ' mic-active animate-mic-pulse' : ''}${isDisabled ? ' opacity-50 cursor-not-allowed' : ''}`}
      >
        {starting ? '⏳' : recording ? '⏹ Stop' : '🎤 Mic'}
      </button>

      {/* role="alert" ensures screen readers announce errors as they appear */}
      {errorMessage && (
        <span
          role="alert"
          className="text-[11px] text-red-400 max-w-[180px] text-right"
        >
          {errorMessage}
        </span>
      )}
    </div>
  )
}
