import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { Logo } from '@/components/Logo'
import { ProgressDots } from '@/components/ProgressDots'
import { FieldError } from '@/components/FieldError'
import {
  CountryPhoneInput,
  validatePhoneNumber,
  ALL_COUNTRIES,
} from '@/components/CountryPhoneInput'
import type { Country } from '@/components/CountryPhoneInput'
import { userApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

// ─── Log out button style ─────────────────────────────────────────────────────
const LOG_OUT_SHADOW =
  '0px 4px 4px -2px rgba(17,29,80,0.04), 0px 2px 2px -1px rgba(17,29,80,0.04), 0px 1px 1px -0.5px rgba(17,29,80,0.04), 0px 0px 0px 1px rgba(17,29,80,0.08)'

// Default country: United States (+1)
const DEFAULT_COUNTRY: Country =
  ALL_COUNTRIES.find((c) => c.code === 'US') ?? ALL_COUNTRIES[0]

// ─── Component ────────────────────────────────────────────────────────────────
export function ProfilePage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY)
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const navigate = useNavigate()
  const { setUser, clearAuth } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    navigate({ to: '/login' })
  }

  // ── Validation ──
  const phoneError =
    submitAttempted && !validatePhoneNumber(phoneNumber, country.code)
      ? 'Enter a valid phone number'
      : ''

  // ── Mutation ──
  const { mutate, isPending, error } = useMutation({
    mutationFn: () =>
      userApi.onboard({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phoneNumber.replace(/\s/g, ''),
        phone_country_code: country.dialCode,
      }),
    onSuccess: ({ data }) => {
      setUser(data.data)
      navigate({ to: '/onboarding/portfolio' })
    },
  })

  const apiError =
    (error as any)?.response?.data?.error?.message ??
    (error ? 'Something went wrong' : null)

  const canSubmit = firstName.trim().length > 0 && lastName.trim().length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitAttempted(true)
    if (!validatePhoneNumber(phoneNumber, country.code)) return
    mutate()
  }

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: 'var(--color-background)' }}
    >
      {/* ── Top navigation ── */}
      <header
        className="flex items-center justify-between shrink-0"
        style={{ height: '72px', padding: '0 40px' }}
      >
        <Logo />

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-center transition-opacity hover:opacity-80 active:scale-[0.97]"
          style={{
            width: '72px',
            height: '32px',
            padding: '8px 12px',
            borderRadius: '10px',
            background:
              'linear-gradient(180deg, #FFFFFF 0%, #F9F9FB 65%, #EFF0F5 100%)',
            boxShadow: LOG_OUT_SHADOW,
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            fontWeight: 600,
            color: '#2C2E35',
            cursor: 'pointer',
            border: 'none',
          }}
        >
          Log out
        </button>
      </header>

      {/* ── Centered form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div
          style={{
            width: '343px',
            animation: 'fadeInUp 0.55s cubic-bezier(0.16,1,0.3,1) both',
          }}
        >
          {/* Heading */}
          <div className="text-center mb-8">
            <h1
              className="font-bold text-foreground"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '24px',
                lineHeight: '32px',
                letterSpacing: '-0.1px',
              }}
            >
              Complete Account Creation
            </h1>
            <p
              className="mt-2"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                lineHeight: '22px',
                color: 'var(--color-muted)',
              }}
            >
              Provide your basic information to complete your account creation
            </p>
          </div>

          {/* Form fields */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col"
            style={{ gap: '16px' }}
          >
            {/* First Name */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="first-name"
                className="text-sm font-medium text-foreground"
              >
                First Name
              </label>
              <input
                id="first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
                className="w-full h-10 px-4 rounded-xl bg-surface border border-border text-foreground placeholder:text-subtle text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Last Name */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="last-name"
                className="text-sm font-medium text-foreground"
              >
                Last Name
              </label>
              <input
                id="last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
                className="w-full h-10 px-4 rounded-xl bg-surface border border-border text-foreground placeholder:text-subtle text-sm outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Phone Number
              </label>
              <CountryPhoneInput
                value={phoneNumber}
                onChange={setPhoneNumber}
                country={country}
                onCountryChange={(c) => {
                  setCountry(c)
                  setPhoneNumber('')
                }}
                hasError={!!phoneError}
                placeholder="801 234 5678"
              />
              {phoneError && <FieldError message={phoneError} />}
            </div>

            {apiError && <FieldError message={apiError} />}

            {/* Continue CTA */}
            <button
              type="submit"
              disabled={isPending || !canSubmit}
              className={cn(
                'w-full h-10 rounded-xl text-white font-semibold text-sm tracking-[0.1px]',
                'bg-gradient-to-b from-primary to-primary-dark',
                'transition-[opacity,transform] duration-150',
                isPending || !canSubmit
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:opacity-90 active:scale-[0.98] active:opacity-80',
              )}
              style={{ marginTop: '4px' }}
            >
              {isPending ? 'Saving…' : 'Continue'}
            </button>
          </form>
        </div>
      </div>

      {/* ── Bottom: onboarding step progress ── */}
      <div className="flex justify-center pb-8 shrink-0">
        <ProgressDots steps={3} current={1} />
      </div>
    </div>
  )
}
