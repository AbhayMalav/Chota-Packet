import { useCallback, useEffect, useRef } from 'react'
import axios from 'axios'
import { enhance } from '../services/api'

/**
 * useEnhance — Wraps the enhance API call with abort support.
 *
 * Cancels any in-flight request when:
 *   - A new `run` is called before the previous one completes
 *   - The consuming component unmounts
 *
 * @returns {{
 *   run: (payload: object, openRouterKey: string|null) => Promise<object|null>,
 *   abort: () => void
 * }}
 */
export default function useEnhance() {
  const abortControllerRef = useRef(null)

  // Abort any in-flight request when the consuming component unmounts
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const abort = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
  }, [])

  const run = useCallback(async (payload, openRouterKey) => {
    if (!payload) {
      console.warn('useEnhance: run() called with a null or undefined payload — request aborted.')
      return Promise.reject(new Error('payload is required.'))
    }

    // Cancel the previous in-flight request before starting a new one
    abortControllerRef.current?.abort()

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const { data } = await enhance(payload, openRouterKey, controller.signal)
      return data
    } catch (err) {
      // Intentional cancellations — not an error, return null so callers no-op cleanly
      if (axios.isCancel(err)) return null
      throw err
    } finally {
      // Avoid holding a stale controller after the request settles
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
    }
  }, [])

  return { run, abort }
}
