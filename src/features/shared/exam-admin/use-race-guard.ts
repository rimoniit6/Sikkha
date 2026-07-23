import { useRef, useEffect } from 'react'
import { createRaceGuard } from './utils'

export function useRaceGuard() {
  const guard = useRef(createRaceGuard())
  useEffect(() => {
    const current = guard.current
    return () => current.nextGeneration()
  }, [])
  return guard
}
