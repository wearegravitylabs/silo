import { useId, useState } from 'react'
import { CountryPhoneInput } from '@/components/country-phone-input'
import { FormField } from '@/components/form-field'
import { ReadOnlyField } from '@/components/read-only-field'
import { Input } from '@/components/ui/input'
import { ChangeEmailDialog } from './change-email-dialog'
import type { ProfileDraft, ProfileErrors } from './use-profile-draft'

/** Names, email (read-only; the pencil opens Change Email) and phone. Enter submits via `onSubmit`. */
export function ProfileFields({
  email,
  draft,
  errors,
  onChange,
  onSubmit,
}: {
  email: string
  draft: ProfileDraft
  errors: ProfileErrors
  onChange: <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => void
  onSubmit: () => void
}) {
  const [changingEmail, setChangingEmail] = useState(false)
  const id = useId()

  return (
    <>
      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First Name" htmlFor={`${id}-first`} error={errors.firstName}>
            <Input
              id={`${id}-first`}
              value={draft.firstName}
              onChange={(e) => onChange('firstName', e.target.value)}
              autoComplete="given-name"
              aria-invalid={!!errors.firstName || undefined}
            />
          </FormField>
          <FormField label="Last Name" htmlFor={`${id}-last`} error={errors.lastName}>
            <Input
              id={`${id}-last`}
              value={draft.lastName}
              onChange={(e) => onChange('lastName', e.target.value)}
              autoComplete="family-name"
              aria-invalid={!!errors.lastName || undefined}
            />
          </FormField>
        </div>

        <FormField label="Email Address" htmlFor={`${id}-email`}>
          <ReadOnlyField
            id={`${id}-email`}
            type="email"
            value={email}
            onEdit={() => setChangingEmail(true)}
            editLabel="Change email address"
            className="bg-accent"
          />
        </FormField>

        <FormField label="Phone number" htmlFor={`${id}-phone`} error={errors.phoneNumber}>
          <CountryPhoneInput
            id={`${id}-phone`}
            value={draft.phoneNumber}
            onChange={(v) => onChange('phoneNumber', v)}
            country={draft.country}
            onCountryChange={(c) => onChange('country', c)}
            invalid={!!errors.phoneNumber}
          />
        </FormField>

        {/* Lets Enter in any field save, like the bar's button */}
        <button type="submit" hidden />
      </form>
      {/* Outside the form: React bubbles the dialog's own submit through the portal */}
      <ChangeEmailDialog open={changingEmail} onOpenChange={setChangingEmail} currentEmail={email} />
    </>
  )
}
