'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { BookLoader } from './BookLoader'
import { CircularProgress } from './CircularProgress'
import { LoadingMessages } from './LoadingMessages'
import { Particles } from './Particles'

export function LoadingOverlay() {
  const [mounted, setMounted] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.focus()
    }
  }, [])

  if (!mounted) return null

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/85 dark:bg-slate-900/85 animate-fade-in"
      role="alertdialog"
      aria-busy="true"
      aria-label="Application is loading"
      tabIndex={-1}
    >
      <div
        className="absolute inset-0 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="relative flex flex-col items-center gap-8">
        <Particles />

        <div className="flex flex-col items-center gap-6">
          <BookLoader />
          <CircularProgress />
          <LoadingMessages />
        </div>
      </div>
    </div>,
    document.body,
  )
}
