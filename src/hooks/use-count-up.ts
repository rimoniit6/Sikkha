'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Animates a number from 0 to `target` when the element scrolls into view.
 * Respects prefers-reduced-motion (jumps straight to the target).
 *
 * Usage:
 *   const { ref, value } = useCountUp(1250)
 *   <p ref={ref}>{toBengaliNumerals(value)}</p>
 */
export function useCountUp(target: number, duration = 1200) {
  const ref = useRef<HTMLElement | null>(null)
  // Start at target value so numbers always show (animate if element is visible)
  const [value, setValue] = useState(target)
  const startedRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // If already started, just set target
    if (startedRef.current) {
      setValue(target)
      return
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || target === 0) {
      startedRef.current = true
      setValue(target)
      return
    }

    // Check if already visible - animate from 0
    const rect = el.getBoundingClientRect()
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0
    if (isVisible) {
      startedRef.current = true
      const start = performance.now()
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1)
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
        setValue(Math.round(eased * target))
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
      return
    }

    // Not visible yet - set up observer
    startedRef.current = true
    let rafId: number
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        observer.disconnect()

        const start = performance.now()
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1)
          const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
          setValue(Math.round(eased * target))
          if (progress < 1) rafId = requestAnimationFrame(tick)
        }
        rafId = requestAnimationFrame(tick)
      },
      { threshold: 0.3 }
    )
    observer.observe(el)

    return () => {
      observer.disconnect()
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [target, duration])

  return { ref, value }
}