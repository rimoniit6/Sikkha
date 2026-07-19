'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const CSRF_HEADER = 'x-csrf-token'

export function useCsrf() {
  const [token, setToken] = useState<string | null>(null)
  const [enabled, setEnabled] = useState<boolean>(true)
  const [loading, setLoading] = useState(true)
  const tokenRef = useRef<string | null>(null)

  const fetchCsrfToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/csrf-token', { method: 'GET', credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        // Track whether CSRF is enabled on the server
        if (typeof data.enabled === 'boolean') {
          setEnabled(data.enabled)
        }
        // Always store the returned token — even if empty string (CSRF disabled)
        if ('token' in data) {
          const value = data.token || null
          setToken(value)
          tokenRef.current = value
          return value
        }
      }
    } catch {
      // Ignore errors
    } finally {
      setLoading(false)
    }
    return null
  }, [])

  useEffect(() => {
    fetchCsrfToken()
  }, [fetchCsrfToken])

  const refreshToken = useCallback(async (): Promise<string | null> => {
    return fetchCsrfToken()
  }, [fetchCsrfToken])

  return { token, enabled, loading, refreshToken, tokenRef }
}

export function withCsrfHeaders(token: string | null, headers: Record<string, string> = {}): Record<string, string> {
  if (!token) return headers
  return { ...headers, [CSRF_HEADER]: token }
}
