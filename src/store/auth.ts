import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import type { Role } from '@/lib/auth'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  avatar?: string
  phone?: string
  institute?: string
  classLevel?: string
  board?: string
  isPremium: boolean
  premiumExpiry?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User) => void
  logout: () => Promise<void>
  setLoading: (loading: boolean) => void
  updateUser: (data: Partial<User>) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: (user) => set({ user, isAuthenticated: true, isLoading: false }),
    logout: async () => {
      await fetch('/api/auth/logout', { method: 'POST' })
      set({ user: null, isAuthenticated: false, isLoading: false })
    },
    setLoading: (isLoading) => set({ isLoading }),
    updateUser: (data) =>
      set((state) => ({
        user: state.user ? { ...state.user, ...data } : null,
      })),
    clearAuth: () => set({ user: null, isAuthenticated: false, isLoading: false }),
  }),
  {
    name: 'edu-auth',
    partialize: (state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
    }),
  }
))

export const useAuthUser = () => useAuthStore((s) => s.user)
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated)
export const useAuthLoading = () => useAuthStore((s) => s.isLoading)
export const useShallowAuth = () => useAuthStore(useShallow((s) => ({
  user: s.user,
  isAuthenticated: s.isAuthenticated,
  isLoading: s.isLoading,
})))
