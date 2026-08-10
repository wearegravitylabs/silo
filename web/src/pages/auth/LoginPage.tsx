import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { Logo } from '@/components/Logo'
import { FieldError } from '@/components/FieldError'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const SOCIAL_SHADOW =
  '0px 4px 4px -2px rgba(17,29,80,0.04), 0px 2px 2px -1px rgba(17,29,80,0.04), 0px 1px 1px -0.5px rgba(17,29,80,0.04), 0px 0px 0px 1px rgba(17,29,80,0.08)'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const navigate = useNavigate()
  const setPendingEmail = useAuthStore((s) => s.setPendingEmail)

  const emailError = touched && !EMAIL_RE.test(email) ? 'Enter a valid email address' : ''

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => authApi.sendCode(email),
    onSuccess: () => {
      setPendingEmail(email)
      navigate({ to: '/verify-email' })
    },
  })

  const apiError =
    (error as any)?.response?.data?.error?.message ?? (error ? 'Something went wrong' : null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!EMAIL_RE.test(email)) return
    mutate()
  }

  return (
    <>
      {/* Header */}
      <div className="text-center mb-6">
        <Logo className="justify-center mb-6" />
        <h1
          className="font-bold text-foreground mb-3"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '24px',
            lineHeight: '32px',
            letterSpacing: '-0.1px',
          }}
        >
          Welcome back
        </h1>
        <p className="text-sm text-muted leading-[22px] tracking-[-0.1px]">
          Sign in to your Silo account to continue tracking your wealth.
        </p>
      </div>

      {/* Social buttons — cloud only */}
      <div className="flex flex-col gap-3 mb-5">
        <SocialButton icon={<GoogleIcon />} label="Continue with Google" />
        <SocialButton icon={<AppleIcon />} label="Continue with Apple ID" />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-1 mb-5">
        <div className="flex-1 h-px bg-[#E3E5ED]" />
        <span className="text-sm text-muted px-1">or</span>
        <div className="flex-1 h-px bg-[#E3E5ED]" />
      </div>

      {/* Email form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-1">
        <div className="flex flex-col gap-2 mb-1">
          <label
            className="text-sm font-medium text-foreground tracking-[0.1px]"
            htmlFor="email"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="john.doe@yahoo.com"
            className={cn(
              'w-full h-10 px-4 rounded-xl bg-surface text-foreground placeholder:text-subtle text-sm outline-none transition-colors',
              emailError
                ? 'border-2 border-danger focus:border-danger'
                : 'border border-border focus:border-primary',
            )}
          />
          {emailError && <FieldError message={emailError} />}
          {apiError && !emailError && <FieldError message={apiError} />}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            'w-full h-10 rounded-xl text-white font-semibold text-sm tracking-[0.1px] mt-3',
            'bg-gradient-to-b from-primary to-primary-dark',
            'transition-[opacity,transform] duration-150',
            isPending
              ? 'opacity-60 cursor-not-allowed'
              : 'hover:opacity-90 active:scale-[0.98] active:opacity-80',
          )}
        >
          {isPending ? 'Sending...' : 'Continue with Email'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted tracking-[-0.1px]">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-medium text-foreground hover:underline">
          Sign up
        </Link>
      </p>
    </>
  )
}

function SocialButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      disabled
      title="Available in Silo Cloud"
      className="flex items-center justify-center gap-2 w-full h-10 px-[14px] rounded-xl text-foreground text-sm font-semibold tracking-[0.1px] opacity-50 cursor-not-allowed"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F9F9FB 65%, #EFF0F5 100%)',
        boxShadow: SOCIAL_SHADOW,
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.253 17.64 11.945 17.64 9.2z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 814 1000" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-54.3-155.5-127.4C46.7 790.7 0 663 0 541.8c0-207.5 135.4-317.3 268.5-317.3 71 0 130.1 46.4 173.4 46.4 42.6 0 109.5-49.8 190.8-49.8zM520 188.9c-7.4-41.1 15.4-81.9 37.9-107.8C584.2 47.8 629.7 20 672.6 20c2.3 0 4.7 0 6.9.2-2.5 41.1-19.4 81.7-45 111.3-23.3 27.4-66.6 56.4-114.5 57.4z" />
    </svg>
  )
}
