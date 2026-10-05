import { useState } from 'react'
import { CountryPhoneInput } from '@/components/country-phone-input'
import { FieldError } from '@/components/field-error'
import { getErrorMessage } from '@/lib/api-client'
import { findCountry, validatePhoneNumber, ALL_COUNTRIES, type Country } from '@/lib/countries'
import { cn } from '@/lib/utils'
import { useOnboard } from '../queries'

const DEFAULT_COUNTRY: Country = findCountry('US') ?? ALL_COUNTRIES[0]

/** Onboarding step 1: name + phone. Calls onDone once the profile is saved. */
export function ProfileForm({ onDone }: { onDone: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const { mutate, isPending, error } = useOnboard()

  const phoneError =
    submitAttempted && !validatePhoneNumber(phoneNumber, country) ? 'Enter a valid phone number' : ''
  const apiError = getErrorMessage(error, 'Something went wrong')
  const canSubmit = firstName.trim().length > 0 && lastName.trim().length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitAttempted(true)
    if (!validatePhoneNumber(phoneNumber, country)) return
    mutate(
      {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phoneNumber.replace(/\s/g, ''),
        phone_country_code: country.dialCode,
      },
      { onSuccess: onDone },
    )
  }

  return (
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
            color: 'var(--color-muted-foreground)',
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
  )
}
