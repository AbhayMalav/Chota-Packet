import { useState, useRef, useCallback } from 'react'
import { stt as apiStt } from '../services/api'

export function useRecorder({ onTranscript, lang = 'en' }) {
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      chunksRef.current = []

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop()) // cleanup (FR-18)
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        try {
          const { data } = await apiStt(blob, lang)
          onTranscript?.(data.transcript || '')
        } catch (err) {
          const msg = err.response?.data?.detail || 'Speech recognition failed.'
          setError(msg)
        }
      }
      mr.start()
      setRecording(true)
    } catch (err) {
      if (err.name === 'NotAllowedError') setError('Microphone permission denied.')
      else setError('Could not start recording.')
    }
  }, [lang, onTranscript])

  const stop = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }, [])

  return { recording, error, start, stop }
}
