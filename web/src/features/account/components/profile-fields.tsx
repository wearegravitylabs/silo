import { useId, useState } from 'react'
import { PencilIcon } from 'lucide-react'
import { CountryPhoneInput } from '@/components/country-phone-input'
import { FormField } from '@/components/form-field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'
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
          <InputGroup className="bg-accent">
            <InputGroupInput id={`${id}-email`} type="email" value={email} readOnly className="cursor-default text-subtle" />
            <button
              type="button"
              onClick={() => setChangingEmail(true)}
              aria-label="Change email address"
              className="mr-2 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              <PencilIcon className="size-3.5" />
            </button>
          </InputGroup>
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
