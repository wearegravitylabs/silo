import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { sendCode, verifyCode } from './api'

/** Emails a one-time code and remembers the address for the verify step. */
export const useSendCode = () => {
  const setPendingEmail = useAuthStore((s) => s.setPendingEmail)
  return useMutation({
    mutationFn: sendCode,
    onSuccess: (_, email) => setPendingEmail(email),
  })
}

/** Exchanges email + code for tokens and stores the session. */
export const useVerifyCode = () => {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: (v: { email: string; code: string }) => verifyCode(v.email, v.code),
    onSuccess: setAuth,
  })
}
