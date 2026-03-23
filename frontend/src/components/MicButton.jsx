import React, { useState } from 'react'
import useRecorder from '../hooks/useRecorder'
import { MicIcon, StopIcon, XIcon } from './icons'


// Inline spinner - matches ControlBar's LoadSpinner pattern
function Spinner() {
  return (
    <svg
      className="animate-spin w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-2a8 8 0 01-8-8z" />
    </svg>
  )
}


export default function MicButton({ onTranscript = () => { }, lang }) {
  const { recording, error, start, stop } = useRecorder({ onTranscript, lang })
  const [starting, setStarting] = useState(false)
  const [dismissed, setDismissed] = useState(false)


  // Reset dismissed state whenever a new error arrives
  const prevError = React.useRef(null)
  if (error !== prevError.current) {
    prevError.current = error
    if (error) setDismissed(false)
  }


  const handleClick = async () => {
    if (recording) { stop(); return }
    setStarting(true)
    try {
      await start()
    } finally {
      setStarting(false)
    }
  }


  const errorMessage = error
    ? (error instanceof Error ? error.message : String(error))
    : null

  const isDisabled = starting && !recording

  const ariaLabel = starting
    ? 'Starting microphone…'
    : recording
      ? 'Stop recording'
      : 'Start voice input'


  return (
    <div className="flex flex-col items-end gap-1.5">

      <button
        onClick={handleClick}
        disabled={isDisabled}
        aria-label={ariaLabel}
        title={ariaLabel}
        className={[
          'btn-icon',
          recording ? 'mic-active animate-mic-pulse' : '',
          recording ? 'motion-reduce:animate-none motion-reduce:ring-2 motion-reduce:ring-red-500/60' : '',
          isDisabled ? 'opacity-50 cursor-not-allowed' : '',
        ].filter(Boolean).join(' ')}
      >
        {starting
          ? <Spinner />
          : recording
            ? <StopIcon className="w-4 h-4" />
            : <MicIcon className="w-4 h-4" />
        }
      </button>

      {/* Error message - dismissable, announced to screen readers */}
      {errorMessage && !dismissed && (
        <div
          role="alert"
          className="flex items-start gap-1 max-w-[180px] animate-fade-in"
        >
          <span className="text-[11px] text-red-400 text-right leading-tight flex-1">
            {errorMessage}
          </span>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss microphone error"
            className="text-red-400/60 flex-shrink-0 mt-0.5 transition-colors"
          >
            <XIcon className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}
