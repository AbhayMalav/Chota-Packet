import React, { useRef, useEffect } from 'react'
import { render, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { usePopoverPosition } from './usePopoverPosition'

function TestComponent({ options, triggerRect, popoverSize, triggerExists = true }) {
  const triggerRef = useRef(null)
  const popoverRef = useRef(null)
  const { position, recalculate } = usePopoverPosition(triggerRef, popoverRef, options)

  useEffect(() => {
    if (triggerExists && triggerRef.current) {
      triggerRef.current.getBoundingClientRect = () => triggerRect
    }
  }, [triggerExists, triggerRect])

  useEffect(() => {
    if (popoverRef.current && popoverSize) {
      Object.defineProperty(popoverRef.current, 'offsetWidth', { value: popoverSize.width, configurable: true })
      Object.defineProperty(popoverRef.current, 'offsetHeight', { value: popoverSize.height, configurable: true })
    }
  }, [popoverSize])

  return (
    <div>
      {triggerExists && <div ref={triggerRef} data-testid="trigger" />}
      <div ref={popoverRef} data-testid="popover" />
      <pre data-testid="position">{JSON.stringify(position)}</pre>
      <button data-testid="recalculate" onClick={recalculate}>Recalculate</button>
    </div>
  )
}

describe('usePopoverPosition', () => {
  const defaultTriggerRect = { top: 200, bottom: 240, left: 100, right: 140, width: 40, height: 40 }
  const defaultPopoverSize = { width: 360, height: 300 }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  function setup(opts = {}, triggerRect = defaultTriggerRect, popoverSize = defaultPopoverSize, triggerExists = true) {
    let result
    act(() => {
      result = render(<TestComponent options={opts} triggerRect={triggerRect} popoverSize={popoverSize} triggerExists={triggerExists} />)
    })
    act(() => {
      vi.runAllTimers()
    })
    return result
  }

  it('Returns right-of-trigger position by default', () => {
    const { getByTestId } = setup()
    const position = JSON.parse(getByTestId('position').textContent)
    expect(position.left).toBe(defaultTriggerRect.right + 12)
    expect(position.top).toBe(defaultTriggerRect.bottom + 12)
    expect(position.right).toBe('auto')
    expect(position.bottom).toBe('auto')
  })

  it('Flips left when right position overflows viewport width', () => {
    const triggerNearRight = { top: 200, bottom: 240, left: 900, right: 940, width: 40, height: 40 }
    const { getByTestId } = setup({}, triggerNearRight)
    const position = JSON.parse(getByTestId('position').textContent)
    expect(position.left).toBe('auto')
    expect(position.right).toBe(window.innerWidth - triggerNearRight.left + 12)
  })

  it('Flips upward when downward position overflows viewport height', () => {
    const triggerNearBottom = { top: 600, bottom: 640, left: 100, right: 140, width: 40, height: 40 }
    const { getByTestId } = setup({}, triggerNearBottom)
    const position = JSON.parse(getByTestId('position').textContent)
    expect(position.top).toBe('auto')
    expect(position.bottom).toBe(window.innerHeight - triggerNearBottom.top + 12)
  })

  it('Returns { top: 0, left: 0 } when triggerRef is null and warns', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    function NullTriggerComponent() {
      const triggerRef = useRef(null)
      const popoverRef = useRef(null)
      const { position } = usePopoverPosition(triggerRef, popoverRef)

      return (
        <div>
          <div ref={popoverRef} data-testid="popover" />
          <pre data-testid="position">{JSON.stringify(position)}</pre>
        </div>
      )
    }

    let result
    act(() => {
      result = render(<NullTriggerComponent />)
    })
    act(() => {
      vi.runAllTimers()
    })

    const position = JSON.parse(result.getByTestId('position').textContent)
    expect(position).toEqual({ top: 0, left: 0 })
    expect(consoleSpy).toHaveBeenCalledWith('[usePopoverPosition] Trigger ref not mounted yet')
    consoleSpy.mockRestore()
  })

  it('Recalculates on window resize event', () => {
    const { getByTestId } = setup()
    const initialPosition = JSON.parse(getByTestId('position').textContent)

    act(() => {
      const originalInnerWidth = window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        value: 500,
        configurable: true,
        writable: true
      })
      window.dispatchEvent(new Event('resize'))
      vi.runAllTimers()

      Object.defineProperty(window, 'innerWidth', {
        value: originalInnerWidth,
        configurable: true,
        writable: true
      })
    })

    const newPosition = JSON.parse(getByTestId('position').textContent)
    expect(newPosition).not.toEqual(initialPosition)
  })

  it('Cleans up resize listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = setup()

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    removeEventListenerSpy.mockRestore()
  })

  it('Defers calculation when popover has zero dimensions', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      setTimeout(cb, 0)
      return 1
    })

    const { getByTestId } = setup({}, defaultTriggerRect, { width: 0, height: 0 })

    expect(rafSpy).toHaveBeenCalled()

    act(() => {
      vi.runAllTimers()
    })

    rafSpy.mockRestore()
  })

  it('Returns { top: 0, left: 0 } when window is undefined', () => {
    function WindowlessComponent() {
      const triggerRef = useRef(null)
      const popoverRef = useRef(null)
      const { position } = usePopoverPosition(triggerRef, popoverRef)

      return (
        <div>
          <div ref={triggerRef} data-testid="trigger" />
          <div ref={popoverRef} data-testid="popover" />
          <pre data-testid="position">{JSON.stringify(position)}</pre>
        </div>
      )
    }

    let result
    act(() => {
      result = render(<WindowlessComponent />)
    })

    const position = JSON.parse(result.getByTestId('position').textContent)
    expect(position).toEqual({ top: 0, left: 0 })
  })
})
