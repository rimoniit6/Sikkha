'use client'

import { useState, useEffect, useCallback } from 'react'
import { LOADING_MESSAGES } from '@/utils/loading'

export function LoadingMessages() {
  const [index, setIndex] = useState(0)

  const nextMessage = useCallback(() => {
    setIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(nextMessage, LOADING_MESSAGES[index].duration)
    return () => clearInterval(timer)
  }, [index, nextMessage])

  return (
    <div
      className="relative h-6 flex items-center justify-center"
      aria-live="polite"
      aria-atomic="true"
    >
      <p
        key={index}
        className="text-sm text-muted-foreground text-center whitespace-nowrap animate-fade-in"
      >
        {LOADING_MESSAGES[index].text}
      </p>
    </div>
  )
}
