import { useEffect, useRef } from 'react'

/** Calls callback on every animation frame. Cleans up on unmount. */
export function useAnimationFrame(callback: (dt: number) => void, active: boolean) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!active) return

    let lastTime = performance.now()
    let rafId: number

    const loop = (now: number) => {
      const dt = now - lastTime
      lastTime = now
      callbackRef.current(dt)
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [active])
}
