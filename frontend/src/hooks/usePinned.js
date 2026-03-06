import { useState, useCallback } from 'react'
import { LS_PINNED, MAX_PINNED } from '../constants'

export function usePinned() {
  const load = () => { try { return JSON.parse(localStorage.getItem(LS_PINNED) || '[]') } catch { return [] } }
  const [pinned, setPinned] = useState(load)

  const pin = useCallback((entry) => {
    setPinned((prev) => {
      if (prev.length >= MAX_PINNED) return prev
      if (prev.some((p) => p.enhanced === entry.enhanced)) return prev
      const next = [entry, ...prev]
      localStorage.setItem(LS_PINNED, JSON.stringify(next))
      return next
    })
  }, [])

  const unpin = useCallback((enhanced) => {
    setPinned((prev) => {
      const next = prev.filter((p) => p.enhanced !== enhanced)
      localStorage.setItem(LS_PINNED, JSON.stringify(next))
      return next
    })
  }, [])

  return { pinned, pin, unpin }
}
