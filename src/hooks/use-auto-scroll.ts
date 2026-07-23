'use client'

import { useCallback, useEffect, useRef } from 'react'

export interface UseAutoScrollOptions {
  /** Scrollable container element. Defaults to `window` if not provided. */
  containerRef?: React.RefObject<HTMLElement | null>
  /** Target element to scroll to. Required. */
  targetRef: React.RefObject<HTMLElement | null>
  /** CSS scroll-behavior value. Default `'smooth'`. */
  behavior?: ScrollBehavior
  /** Top offset in px (useful for sticky headers). Default `16`. */
  offset?: number
  /** Whether auto-scroll is currently enabled. Default `true`. */
  enabled?: boolean
}

/**
 * Auto-scrolls a container so the target element becomes visible whenever
 * `trigger` changes to a truthy/selected value.
 *
 * Designed for payment flows where selecting a payment method (trigger)
 * should reveal the payment-info section (target) without the user
 * needing to scroll manually.
 *
 * @example
 * ```tsx
 * const paymentInfoRef = useRef<HTMLDivElement>(null)
 * useAutoScroll(selectedMethod, { targetRef: paymentInfoRef })
 * ```
 */
export function useAutoScroll(
  trigger: unknown,
  { containerRef, targetRef, behavior = 'smooth', offset = 16, enabled = true }: UseAutoScrollOptions,
) {
  // Track the previous trigger value so we only scroll on *changes*
  const prevTriggerRef = useRef<unknown>(trigger)

  const scroll = useCallback(() => {
    if (!enabled) return
    const target = targetRef.current
    if (!target) return

    const container = containerRef?.current
    if (container) {
      const targetRect = target.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      const relativeTop = targetRect.top - containerRect.top + container.scrollTop - offset
      container.scrollTo({ top: relativeTop, behavior })
    } else {
      // Fallback: scroll the window
      const targetRect = target.getBoundingClientRect()
      window.scrollTo({
        top: window.scrollY + targetRect.top - offset,
        behavior,
      })
    }
  }, [containerRef, targetRef, behavior, offset, enabled])

  useEffect(() => {
    if (!enabled) return

    const prev = prevTriggerRef.current
    prevTriggerRef.current = trigger

    // Trigger is falsy → nothing selected yet → no scroll needed
    if (!trigger) return

    // Avoid scrolling on initial mount if trigger already has a value
    // (e.g. when selecting a method that was previously chosen before a re-render)
    if (prev === undefined && trigger) {
      // first render with a value — skip scroll if the target is already visible
      const target = targetRef.current
      if (target) {
        const rect = target.getBoundingClientRect()
        const container = containerRef?.current
        if (container) {
          const cRect = container.getBoundingClientRect()
          // If already visible, skip
          if (rect.top >= cRect.top && rect.bottom <= cRect.bottom) return
        } else {
          if (rect.top >= 0 && rect.bottom <= window.innerHeight) return
        }
      }
    }

    // Wait a microtask so the newly rendered target DOM is available
    const raf = requestAnimationFrame(() => scroll())
    return () => cancelAnimationFrame(raf)
  }, [trigger, enabled, scroll, targetRef, containerRef])
}
