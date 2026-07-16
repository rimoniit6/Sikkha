'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

interface RevealProps {
  children: ReactNode
  /** Slide-in direction (default 'up') */
  direction?: Direction
  /** Extra delay in ms — use for stagger: delay={index * 60} */
  delay?: number
  /** Animation duration in ms */
  duration?: number
  className?: string
  /** Render as a different element (default 'div') */
  as?: 'div' | 'section' | 'li' | 'span'
  /** Re-animate every time it enters the viewport (default: once) */
  once?: boolean
}

const HIDDEN: Record<Direction, string> = {
  up: 'translate3d(0, 24px, 0)',
  down: 'translate3d(0, -24px, 0)',
  left: 'translate3d(24px, 0, 0)',
  right: 'translate3d(-24px, 0, 0)',
  none: 'none',
}

/**
 * Scroll-reveal wrapper: fades + slides children in when they enter the viewport.
 * GPU-friendly (opacity/transform only) and respects prefers-reduced-motion.
 *
 *   <Reveal delay={i * 60}><Card .../></Reveal>
 */
export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 600,
  className,
  as: Tag = 'div',
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(true) // Start visible to avoid blank pages
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    // Check if already visible - if not, mark for animation
    const rect = el.getBoundingClientRect()
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0
    if (!isVisible) {
      setShouldAnimate(true)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            if (once) observer.disconnect()
          } else if (!once) {
            setVisible(false)
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [once])

  // Determine styles: if shouldAnimate, use transitions; otherwise render visible immediately
  const style = shouldAnimate ? {
    opacity: visible ? 1 : 0,
    transform: visible ? 'none' : HIDDEN[direction],
    transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
  } : {
    opacity: 1,
    transform: 'none',
  }

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={cn('will-change-[opacity,transform]', className)}
      style={style}
    >
      {children}
    </Tag>
  )
}
