import { useMutation } from '@tanstack/react-query'
import { sendCode, verifyCode } from './api'
import type { VerifyCodeInput } from './types'

export const useSendCode = () => useMutation({ mutationFn: sendCode })

/** Resolves with the signed-in user; the caller decides where it goes (cache, redirect). */
export const useVerifyCode = <TUser>() => useMutation({ mutationFn: (input: VerifyCodeInput) => verifyCode<TUser>(input) })
