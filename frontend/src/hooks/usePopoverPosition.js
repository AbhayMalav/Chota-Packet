import { useState, useRef, useCallback, useEffect } from 'react'

const VIEWPORT_MARGIN = 16
const DEFAULT_POSITION = { top: 0, left: 0 }

/**
 * usePopoverPosition — calculates popover position with viewport boundary clamping.
 *
 * @param {React.RefObject} triggerRef - ref on the trigger button
 * @param {React.RefObject} popoverRef - ref on the popover panel
 * @param {{ preferSide: 'right'|'left', preferVertical: 'down'|'up', gap?: number, estimatedWidth?: number }} options
 * @returns {{ position: { top: number | 'auto', bottom: number | 'auto', left: number | 'auto', right: number | 'auto' }, recalculate: () => void }}
 */
export function usePopoverPosition(triggerRef, popoverRef, options = {}) {
  const {
    preferSide = 'right',
    preferVertical = 'down',
    gap = 12,
    estimatedWidth = 360,
  } = options

  const [position, setPosition] = useState(DEFAULT_POSITION)
  const rafIdRef = useRef(null)
  const retryCountRef = useRef(0)
  const MAX_RETRY = 5

  const calculatePosition = useCallback(() => {
    if (typeof window === 'undefined') {
      setPosition(DEFAULT_POSITION)
      return
    }

    const trigger = triggerRef.current
    if (!trigger) {
      console.warn('[usePopoverPosition] Trigger ref not mounted yet')
      setPosition(DEFAULT_POSITION)
      return
    }

    const popover = popoverRef.current
    const triggerRect = trigger.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    let popoverWidth = estimatedWidth
    let popoverHeight = 300

    if (popover && popover.offsetWidth > 0 && popover.offsetHeight > 0) {
      popoverWidth = popover.offsetWidth
      popoverHeight = popover.offsetHeight
      retryCountRef.current = 0
    } else if (popover && (popover.offsetWidth === 0 || popover.offsetHeight === 0)) {
      if (retryCountRef.current >= MAX_RETRY) {
        retryCountRef.current = 0
        return
      }
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      retryCountRef.current += 1
      rafIdRef.current = requestAnimationFrame(() => {
        calculatePosition()
      })
      return
    }

    if (vw < 400) {
      setPosition({
        top: 'auto',
        bottom: vh - triggerRect.top + gap,
        left: '50%',
        right: 'auto',
      })
      return
    }

    let left, right, top, bottom

    if (preferSide === 'right') {
      const proposedLeft = triggerRect.right + gap
      if (proposedLeft + popoverWidth > vw - VIEWPORT_MARGIN) {
        left = 'auto'
        right = vw - triggerRect.left + gap
      } else {
        left = proposedLeft
        right = 'auto'
      }
    } else {
      const proposedRight = vw - triggerRect.left + gap
      if (triggerRect.left - popoverWidth - gap < VIEWPORT_MARGIN) {
        left = triggerRect.right + gap
        right = 'auto'
      } else {
        left = 'auto'
        right = proposedRight
      }
    }

    if (preferVertical === 'down') {
      const proposedTop = triggerRect.bottom + gap
      if (proposedTop + popoverHeight > vh - VIEWPORT_MARGIN) {
        top = 'auto'
        bottom = vh - triggerRect.top + gap
      } else {
        top = proposedTop
        bottom = 'auto'
      }
    } else {
      const proposedBottom = vh - triggerRect.top + gap
      if (triggerRect.bottom - popoverHeight - gap < VIEWPORT_MARGIN) {
        top = triggerRect.bottom + gap
        bottom = 'auto'
      } else {
        top = 'auto'
        bottom = proposedBottom
      }
    }

    setPosition({ top, bottom, left, right })
  }, [triggerRef, popoverRef, preferSide, preferVertical, gap, estimatedWidth])

  const recalculate = useCallback(() => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    rafIdRef.current = requestAnimationFrame(() => {
      calculatePosition()
    })
  }, [calculatePosition])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => recalculate()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    }
  }, [recalculate])

  useEffect(() => {
    recalculate()
  }, [recalculate])

  return { position, recalculate }
}

export default usePopoverPosition
