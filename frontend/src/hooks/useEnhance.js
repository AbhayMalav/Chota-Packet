import { useCallback, useRef } from 'react'
import { enhance } from '../services/api'

/**
 * useEnhance - Wraps the enhance API call with abort support.
 * Cancels any in-flight request if a new one is fired before the previous completes.
 *
 * @returns {{ run: (payload: object, openRouterKey: string|null) => Promise<object> }}
 */
export default function useEnhance() {
  const abortControllerRef = useRef(null)

  const run = useCallback(async (payload, openRouterKey) => {
    // Abort any previous in-flight request before starting a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const { data } = await enhance(payload, openRouterKey, controller.signal)
      return data
    } catch (err) {
      // Don't surface abort errors - these are intentional cancellations
      if (err?.name === 'CanceledError' || err?.name === 'AbortError') {
        return null
      }
      throw err
    } finally {
      // Clear ref so we don't hold a stale controller
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
    }
  }, [])

  return { run }
}
