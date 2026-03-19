import { useState, useCallback, useEffect } from 'react'
import { LS_PINNED, MAX_PINNED } from '../constants'

export function usePinned() {
  const load = () => { try { return JSON.parse(localStorage.getItem(LS_PINNED) || '[]') } catch { return [] } }
  const [pinned, setPinned] = useState(load)

  useEffect(() => {
    localStorage.setItem(LS_PINNED, JSON.stringify(pinned))
  }, [pinned])

  const pin = useCallback((entry) => {
    setPinned((prev) => {
      if (prev.length >= MAX_PINNED) return prev
      if (prev.some((p) => p.enhanced === entry.enhanced)) return prev
      return [entry, ...prev]
    })
  }, [])

  const unpin = useCallback((enhanced) => {
    setPinned((prev) => prev.filter((p) => p.enhanced !== enhanced))
  }, [])

  return { pinned, pin, unpin }
}
