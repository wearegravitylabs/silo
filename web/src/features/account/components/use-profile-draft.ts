import { useState } from 'react'
import { toast } from 'sonner'
import { ALL_COUNTRIES, findCountry, findCountryByDialCode, validatePhoneNumber, type Country } from '@/lib/countries'
import { useUpdateProfile } from '../queries'
import type { User } from '../types'

export interface ProfileDraft {
  firstName: string
  lastName: string
  phoneNumber: string
  country: Country
}

export type ProfileErrors = Partial<Record<'firstName' | 'lastName' | 'phoneNumber', string>>

const DEFAULT_COUNTRY = findCountry('US') ?? ALL_COUNTRIES[0]

const draftFrom = (user: User): ProfileDraft => ({
  firstName: user.first_name,
  lastName: user.last_name,
  phoneNumber: user.phone_number ?? '',
  country: (user.phone_country_code && findCountryByDialCode(user.phone_country_code)) || DEFAULT_COUNTRY,
})

const sameDraft = (a: ProfileDraft, b: ProfileDraft) =>
  a.firstName === b.firstName && a.lastName === b.lastName && a.phoneNumber === b.phoneNumber && a.country.code === b.country.code

function validate(d: ProfileDraft): ProfileErrors {
  const errors: ProfileErrors = {}
  if (!d.firstName.trim()) errors.firstName = 'Enter your first name'
  if (!d.lastName.trim()) errors.lastName = 'Enter your last name'
  if (d.phoneNumber.trim() && !validatePhoneNumber(d.phoneNumber, d.country)) errors.phoneNumber = 'Enter a valid phone number'
  return errors
}

/**
 * Editable copy of the saved profile. `dirty` while it differs from the user; save validates then writes it,
 * discard drops it. Errors show only after a save attempt, and clear as the field is edited.
 */
export function useProfileDraft(user: User) {
  const saved = draftFrom(user)
  const [draft, setDraft] = useState(saved)
  const [errors, setErrors] = useState<ProfileErrors>({})
  const update = useUpdateProfile()

  const change = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
    setErrors(({ [key as keyof ProfileErrors]: _, ...rest }) => rest)
  }

  const save = () => {
    const found = validate(draft)
    setErrors(found)
    if (Object.keys(found).length || update.isPending) return
    update.mutate(
      {
        first_name: draft.firstName.trim(),
        last_name: draft.lastName.trim(),
        phone_number: draft.phoneNumber.trim(),
        phone_country_code: draft.country.dialCode,
      },
      {
        // Re-sync with what was stored (trimmed), so the form is clean again.
        onSuccess: (user) => {
          setDraft(draftFrom(user))
          toast.success('Your profile has been updated')
        },
        onError: () => toast.error('Couldn’t save your changes. Try again.'),
      },
    )
  }

  const discard = () => {
    setDraft(saved)
    setErrors({})
  }

  return { draft, errors, change, save, discard, dirty: !sameDraft(draft, saved), saving: update.isPending }
}
