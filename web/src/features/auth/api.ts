import { api } from '@/lib/api-client'
import type { AuthResponse } from '@/stores/auth-store'

export const sendCode = (email: string) =>
  api<null>('/auth/send-code', { method: 'POST', body: { email } })

export const verifyCode = (email: string, code: string) =>
  api<AuthResponse>('/auth/verify-code', { method: 'POST', body: { email, code } })
