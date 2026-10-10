import { useState } from 'react'
import { CountryPhoneInput } from '@/components/country-phone-input'
import { FieldError } from '@/components/field-error'
import { FormField, FormHeading } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getErrorMessage } from '@/lib/api-client'
import { ALL_COUNTRIES, findCountry, validatePhoneNumber, type Country } from '@/lib/countries'
import { useOnboard } from '@/features/account'

const DEFAULT_COUNTRY: Country = findCountry('US') ?? ALL_COUNTRIES[0]

/** Name + phone. Calls onDone once the profile is saved. */
export function ProfileStep({ onDone }: { onDone: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY)
  const [submitted, setSubmitted] = useState(false)
  const { mutate, isPending, error } = useOnboard()

  const phoneError = submitted && !validatePhoneNumber(phoneNumber, country) ? 'Enter a valid phone number' : undefined
  const canSubmit = firstName.trim() !== '' && lastName.trim() !== ''

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitted(true)
    if (!canSubmit || !validatePhoneNumber(phoneNumber, country)) return
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
    <div>
      <FormHeading
        className="mb-6 gap-2"
        title="Complete Account Creation"
        subtitle="Provide your basic information to complete your account creation"
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormField label="First Name" htmlFor="first-name">
          <Input
            id="first-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
            autoComplete="given-name"
          />
        </FormField>

        <FormField label="Last Name" htmlFor="last-name">
          <Input
            id="last-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Doe"
            autoComplete="family-name"
          />
        </FormField>

        <FormField label="Phone Number" htmlFor="phone" error={phoneError}>
          <CountryPhoneInput
            id="phone"
            value={phoneNumber}
            onChange={setPhoneNumber}
            country={country}
            onCountryChange={(c) => {
              setCountry(c)
              setPhoneNumber('')
            }}
            invalid={!!phoneError}
          />
        </FormField>

        {error && <FieldError message={getErrorMessage(error, 'Something went wrong')} />}

        <Button type="submit" size="lg" disabled={!canSubmit} loading={isPending} loadingText="Saving…" className="mt-2 w-full">
          Continue
        </Button>
      </form>
    </div>
  )
}
