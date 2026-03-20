import { useState, useRef, useCallback, useEffect } from 'react'
import { stt as apiStt } from '../services/api'
import { STT_TIMEOUT_MS } from '../constants'

// ── MIME type resolution ──────────────────────────────────────────────────────

function getSupportedMimeType() {
  const candidates = ['audio/webm', 'audio/ogg', '']
  for (const type of candidates) {
    if (!type || MediaRecorder.isTypeSupported(type)) return type
  }
  return ''
}

// ── Error extraction ──────────────────────────────────────────────────────────

function extractSttError(err) {
  const detail = err.response?.data?.detail
  if (Array.isArray(detail)) return detail.map((d) => d.msg ?? JSON.stringify(d)).join('; ')
  if (typeof detail === 'string' && detail.trim()) return detail
  if (!navigator.onLine) return 'No internet connection.'
  return 'Speech recognition failed.'
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Manages microphone recording and STT transcription lifecycle.
 * Auto-stops after STT_TIMEOUT_MS. Cleans up stream on unmount.
 *
 * @param {{ onTranscript: (text: string) => void, lang?: string }} options
 * @returns {{ recording: boolean, error: string|null, start: () => Promise<void>, stop: () => void }}
 */
export default function useRecorder({ onTranscript, lang = 'en' }) {
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const timeoutRef = useRef(null)
  const mountedRef = useRef(true)

  // Always call the latest onTranscript without it being a useCallback dep
  const onTranscriptRef = useRef(onTranscript)
  useEffect(() => { onTranscriptRef.current = onTranscript }, [onTranscript])

  // Cleanup on unmount - stop recording and release mic
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      clearTimeout(timeoutRef.current)
      // Stop recorder if still active
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      // Release all stream tracks so mic indicator clears in browser
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const stop = useCallback(() => {
    clearTimeout(timeoutRef.current)
    // Guard: only stop if recorder is actually in a recording state
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (mountedRef.current) setRecording(false)
  }, [])

  const start = useCallback(async () => {
    // Guard: reject if already recording
    if (mediaRecorderRef.current?.state === 'recording') {
      if (import.meta.env.DEV) {
        console.warn('[useRecorder] start() called while already recording - ignoring.')
      }
      return
    }

    if (mountedRef.current) setError(null)

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
    } catch (err) {
      if (!mountedRef.current) return
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone permission denied.')
      } else {
        setError('Could not access microphone.')
      }
      return
    }

    let mr
    try {
      const mimeType = getSupportedMimeType()
      mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    } catch (err) {
      // Construction failed - release stream immediately so mic indicator clears
      stream.getTracks().forEach((t) => t.stop())
      if (mountedRef.current) setError('Recording is not supported in this browser.')
      if (import.meta.env.DEV) console.warn('[useRecorder] MediaRecorder construction failed:', err)
      return
    }

    mediaRecorderRef.current = mr

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    mr.onstop = async () => {
      // Release stream tracks - clears mic indicator in browser
      stream.getTracks().forEach((t) => t.stop())

      const mimeType = mr.mimeType || 'audio/webm'
      const blob = new Blob(chunksRef.current, { type: mimeType })
      // Clear chunks only after blob is created - prevents cross-recording contamination
      chunksRef.current = []

      try {
        const { data } = await apiStt(blob, lang)
        if (mountedRef.current) {
          onTranscriptRef.current?.(data.transcript || '')
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(extractSttError(err))
        }
      }
    }

    // Clear chunks immediately before starting - isolated per recording
    chunksRef.current = []
    mr.start()

    if (mountedRef.current) setRecording(true)

    // Auto-stop after STT_TIMEOUT_MS - prevents indefinite mic hold
    timeoutRef.current = setTimeout(() => {
      if (import.meta.env.DEV) {
        console.warn(`[useRecorder] Auto-stopping after ${STT_TIMEOUT_MS}ms timeout.`)
      }
      stop()
    }, STT_TIMEOUT_MS)
  }, [lang, stop])

  return { recording, error, start, stop }
}
