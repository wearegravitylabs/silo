import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/api'

interface AuthState {
  email: string | null
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  currentPortfolioId: string | null

  setPendingEmail: (email: string) => void
  setAuth: (accessToken: string, refreshToken: string, user: User) => void
  setAccessToken: (token: string) => void
  setUser: (user: User) => void
  setCurrentPortfolioId: (id: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      email: null,
      accessToken: null,
      refreshToken: null,
      user: null,
      currentPortfolioId: null,

      setPendingEmail: (email) => set({ email }),

      setAuth: (accessToken, refreshToken, user) =>
        set({ accessToken, refreshToken, user }),

      setAccessToken: (token) => set({ accessToken: token }),

      setUser: (user) => set({ user }),

      setCurrentPortfolioId: (id) => set({ currentPortfolioId: id }),

      clearAuth: () =>
        set({ accessToken: null, refreshToken: null, user: null, email: null, currentPortfolioId: null }),
    }),
    { name: 'silo-auth' },
  ),
)
