import { api } from '@/lib/api-client'
import { setSession } from '@/lib/session'
import type { AuthResponse, VerifyCodeInput } from './types'

/** Emails a 6-digit sign-in code. Creates the account on first use, so sign-up and login share it. */
export const sendCode = (email: string) => api<null>('/auth/send-code', { method: 'POST', body: { email } })

/** Checks the code and starts the session. */
export const verifyCode = async <TUser>(input: VerifyCodeInput): Promise<TUser> => {
  const res = await api<AuthResponse<TUser>>('/auth/verify-code', { method: 'POST', body: input })
  setSession(res)
  return res.user
}
