'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { login, clearAuth, setLoading } = useAuthStore()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          const user = data.data?.user || data.user
          if (user) {
            login(user)
            return
          }
        }
        clearAuth()
      } catch {
        clearAuth()
      }
    }

    fetchUser()
  }, [login, clearAuth, setLoading])

  return <>{children}</>
}
