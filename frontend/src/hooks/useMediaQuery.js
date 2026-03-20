import { useState, useEffect } from 'react'

/**
 * Returns true when the document matches the given CSS media query.
 * Safe in SSR environments - returns false when window is unavailable.
 *
 * @param {string} query - A valid CSS media query string e.g. '(min-width: 1024px)'
 * @returns {boolean}
 */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    if (!query?.trim()) return false
    try {
      return window.matchMedia(query).matches
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!query?.trim()) {
      if (import.meta.env.DEV) {
        console.warn('[useMediaQuery] Received an empty or invalid query - returning false.')
      }
      setMatches(false)
      return
    }

    let mql
    try {
      mql = window.matchMedia(query)
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[useMediaQuery] window.matchMedia threw for query:', query, err)
      }
      setMatches(false)
      return
    }

    // Sync immediately in case the query result changed between render and effect
    setMatches(mql.matches)

    const handler = (e) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}
