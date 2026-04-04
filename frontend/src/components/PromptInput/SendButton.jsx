import React from 'react'
import { SendIcon } from '../ui/icons'
import './SendButton.css'


function Spinner() {
  return (
    <svg
      className="send-btn__spinner animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-2a8 8 0 01-8-8z" />
    </svg>
  )
}


export default function SendButton({
  onSubmit,
  disabled = false,
  isLoading = false,
}) {
  const handleClick = () => {
    if (disabled || isLoading) return
    if (typeof onSubmit !== 'function') {
      console.error('[SendButton] No submit handler provided')
      return
    }
    onSubmit()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className="send-btn btn-icon"
      aria-label="Send for enhancement"
      title="Send for enhancement (Ctrl+Enter)"
    >
      {isLoading ? <Spinner /> : <SendIcon className="w-4 h-4" />}
    </button>
  )
}
