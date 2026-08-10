import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { Logo } from '@/components/Logo'
import { OtpInput } from '@/components/OtpInput'
import { FieldError } from '@/components/FieldError'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'
import type { AuthResponse } from '@/types/api'

const RESEND_COOLDOWN = 60

export function VerifyEmailPage() {
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN)
  const navigate = useNavigate()
  const { email, setAuth } = useAuthStore()

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const { mutate: verify, isPending, error, reset } = useMutation({
    mutationFn: () => authApi.verifyCode(email!, code),
    onSuccess: ({ data }) => {
      const resp: AuthResponse = data.data
      setAuth(resp.access_token, resp.refresh_token, resp.user)
      if (!resp.user.is_onboarded) {
        navigate({ to: '/onboarding/profile' })
      } else {
        navigate({ to: '/dashboard' })
      }
    },
  })

  const { mutate: resend, isPending: isResending } = useMutation({
    mutationFn: () => authApi.sendCode(email!),
    onSuccess: () => {
      setCode('')
      reset()
      setCooldown(RESEND_COOLDOWN)
    },
  })

  const codeError =
    (error as any)?.response?.data?.error?.message ?? (error ? 'Invalid code, please try again.' : null)

  const filled = code.replace(/\s/g, '').length === 6

  // Auto-submit once all 6 digits are entered
  useEffect(() => {
    if (filled && !isPending && !codeError) {
      verify()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filled])

  const handleCodeChange = (val: string) => {
    if (codeError) reset()
    setCode(val)
  }

  return (
    <>
      <div
        className="flex flex-col items-center gap-6"
        style={{ animation: 'fadeInUp 0.55s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        {/* Logo */}
        <Logo className="justify-center" />

        {/* Heading */}
        <div className="flex flex-col items-center gap-3 text-center w-full">
          <h1
            className="font-bold text-foreground"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '24px',
              lineHeight: '32px',
              letterSpacing: '-0.1px',
            }}
          >
            Check your Email
          </h1>
          <p className="text-sm text-muted leading-[22px] tracking-[-0.1px]">
            We've sent you a temporary sign in code. Please check your inbox at{' '}
            <span className="font-semibold text-foreground">{email ?? 'your email'}</span>
          </p>
        </div>

        {/* OTP */}
        <div className="flex flex-col items-center gap-1.5 w-full">
          <OtpInput
            value={code}
            onChange={handleCodeChange}
            hasError={!!codeError}
          />
          {codeError && <FieldError message={codeError} />}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <button
            type="button"
            disabled={isPending || !filled}
            onClick={() => verify()}
            className={cn(
              'w-full h-10 rounded-xl text-white font-semibold text-sm tracking-[0.1px]',
              'bg-gradient-to-b from-primary to-primary-dark',
              'transition-[opacity,transform] duration-150',
              isPending || !filled
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:opacity-90 active:scale-[0.98] active:opacity-80',
            )}
          >
            {isPending ? 'Verifying…' : 'Verify email'}
          </button>

          <button
            type="button"
            disabled={cooldown > 0 || isResending}
            onClick={() => resend()}
            className={cn(
              'w-full h-10 rounded-xl font-semibold text-sm tracking-[0.1px]',
              'transition-[opacity,transform] duration-150',
              cooldown > 0 || isResending
                ? 'opacity-40 cursor-not-allowed text-muted'
                : 'text-primary-dark hover:opacity-70 active:scale-[0.98]',
            )}
          >
            {isResending
              ? 'Sending…'
              : cooldown > 0
                ? `Resend code in ${cooldown}s`
                : 'Resend code'}
          </button>
        </div>
      </div>
    </>
  )
}
