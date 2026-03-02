import { useState, useCallback } from 'react'
import { enhance as apiEnhance } from '../services/api'

export function useEnhance() {
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const run = useCallback(async (payload, openRouterKey) => {
    setStatus('loading')
    setError(null)
    try {
      const { data } = await apiEnhance(payload, openRouterKey)
      setResult(data)
      setStatus('success')
      return data
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        (err.code === 'ECONNABORTED' ? 'Request timed out. Backend may be busy.' : 'Enhancement failed.')
      setError(msg)
      setStatus('error')
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setResult(null)
    setError(null)
  }, [])

  return { status, result, error, run, reset }
}
