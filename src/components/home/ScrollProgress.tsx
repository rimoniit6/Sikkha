'use client'

import { useEffect, useRef, useState } from 'react'

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)

      rafRef.current = requestAnimationFrame(() => {
        const scrollTop = window.scrollY
        const docHeight = document.documentElement.scrollHeight - window.innerHeight
        if (docHeight > 0) {
          setProgress((scrollTop / docHeight) * 100)
        }
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-1 transition-opacity duration-300"
      style={{
        width: `${progress}%`,
        opacity: progress === 0 ? 0 : 1,
        background: 'linear-gradient(90deg, #10b981, #14b8a6, #34d399)',
        willChange: 'width',
        transitionProperty: 'width, opacity',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDuration: '150ms, 300ms',
      }}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="স্ক্রল অগ্রগতি"
    />
  )
}