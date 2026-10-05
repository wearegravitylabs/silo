import { useEffect, useState } from 'react'
import { FieldError } from '@/components/field-error'
import { Logo } from '@/components/logo'
import { getErrorMessage } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { useAuthStore, type User } from '@/stores/auth-store'
import { useSendCode, useVerifyCode } from '../queries'
import { OtpInput } from './otp-input'

const RESEND_COOLDOWN = 60
const CODE_RE = /^\d{6}$/

/** OTP step: verifies the code sent to the pending email, then calls onVerified. */
export function VerifyEmailForm({ onVerified }: { onVerified: (user: User) => void }) {
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN)
  const email = useAuthStore((s) => s.pendingEmail)

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const { mutate: verify, isPending, error, reset } = useVerifyCode()
  const { mutate: resendCode, isPending: isResending } = useSendCode()

  const codeError = getErrorMessage(error, 'Invalid code, please try again.')
  const filled = CODE_RE.test(code)

  const submit = (value: string) => {
    if (!email || isPending) return
    verify({ email, code: value }, { onSuccess: (auth) => onVerified(auth.user) })
  }

  const resend = () => {
    if (!email) return
    resendCode(email, {
      onSuccess: () => {
        setCode('')
        reset()
        setCooldown(RESEND_COOLDOWN)
      },
    })
  }

  // Auto-submit once all digits are entered
  const handleCodeChange = (val: string) => {
    if (codeError) reset()
    setCode(val)
    if (CODE_RE.test(val)) submit(val)
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
          <p className="text-sm text-muted-foreground leading-[22px] tracking-[-0.1px]">
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
            onClick={() => submit(code)}
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
                ? 'opacity-40 cursor-not-allowed text-muted-foreground'
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
