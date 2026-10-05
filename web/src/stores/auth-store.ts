import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone_number: string | null
  phone_country_code: string | null
  avatar_url: string | null
  is_email_verified: boolean
  is_onboarded: boolean
  portfolio_count: number
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
}

interface AuthState {
  /** Email entered on login/signup, kept until the OTP is verified. */
  pendingEmail: string | null
  accessToken: string | null
  refreshToken: string | null
  user: User | null

  setPendingEmail: (email: string) => void
  setAuth: (auth: AuthResponse) => void
  setAccessToken: (token: string) => void
  setUser: (user: User) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      pendingEmail: null,
      accessToken: null,
      refreshToken: null,
      user: null,

      setPendingEmail: (pendingEmail) => set({ pendingEmail }),
      setAuth: ({ access_token, refresh_token, user }) =>
        set({ accessToken: access_token, refreshToken: refresh_token, user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setUser: (user) => set({ user }),
      clearAuth: () => set({ accessToken: null, refreshToken: null, user: null, pendingEmail: null }),
    }),
    { name: 'silo-auth' },
  ),
)

export function getUserInitials(user: User | null) {
  if (!user) return '?'
  return `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || '?'
}
