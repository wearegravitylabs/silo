import { useId, useState } from 'react'
import { EyeIcon, UsersIcon } from 'lucide-react'
import { FieldError } from '@/components/field-error'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { isEmail } from '@/lib/validation'
import { PARTNER_FEATURES, ROLE_DESCRIPTION, ROLE_LABEL } from '../mock-data'
import type { AccessRole, Member, MemberInput, SectionKey } from '../types'

/** What the form starts from: an invite being edited (a Member) or a prefill. */
type Initial = Partial<Pick<Member, 'email' | 'role' | 'sections'>>

const ROLE_ICON = { viewer: <EyeIcon />, partner: <UsersIcon /> }
const ALL_FEATURES = PARTNER_FEATURES.map((f) => f.key)

const COPY = {
  invite: { title: 'Invite Partner', submit: 'Send Invite', pending: 'Sending…' },
  edit: { title: 'Edit Invite', submit: 'Resend Invite', pending: 'Resending…' },
}

/**
 * Invite someone (or edit an open invite and resend it): email, access type, the features they get — all
 * features ticked to start. Checked on submit; `error` is the server's answer (e.g. already invited).
 */
export function InvitePartnerDialog({
  mode = 'invite',
  open,
  onOpenChange,
  initial,
  pending,
  error,
  onSubmit,
  defaultSelectOpen,
}: {
  mode?: 'invite' | 'edit'
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The invite being edited, or a prefill (dev gallery) */
  initial?: Initial
  pending?: boolean
  error?: string
  onSubmit: (input: MemberInput) => void
  /** Dev gallery: open with the access type list showing */
  defaultSelectOpen?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="font-sans">{COPY[mode].title}</DialogTitle>
        </DialogHeader>
        {/* Mounted per opening, so each starts from `initial` */}
        {open && (
          <InviteForm
            mode={mode}
            initial={initial}
            pending={pending}
            error={error}
            onSubmit={onSubmit}
            defaultSelectOpen={defaultSelectOpen}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

type Errors = Partial<Record<'email' | 'role' | 'sections', string>>

function InviteForm({
  mode,
  initial,
  pending,
  error,
  onSubmit,
  defaultSelectOpen,
}: {
  mode: 'invite' | 'edit'
  initial?: Initial
  pending?: boolean
  error?: string
  onSubmit: (input: MemberInput) => void
  defaultSelectOpen?: boolean
}) {
  const [email, setEmail] = useState(initial?.email ?? '')
  const [role, setRole] = useState<AccessRole | ''>(initial?.role && initial.role !== 'owner' ? initial.role : '')
  const [sections, setSections] = useState<SectionKey[]>(initial?.sections ?? ALL_FEATURES)
  const [errors, setErrors] = useState<Errors>({})
  const id = useId()

  const clear = (key: keyof Errors) => setErrors(({ [key]: _, ...rest }) => rest)
  const toggle = (key: SectionKey, on: boolean) => {
    setSections((list) => (on ? ALL_FEATURES.filter((k) => k === key || list.includes(k)) : list.filter((k) => k !== key)))
    clear('sections')
  }

  const submit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const found: Errors = {
      ...(!isEmail(email.trim()) && { email: 'Enter a valid email address' }),
      ...(!role && { role: 'Choose an access type' }),
      ...(sections.length === 0 && { sections: 'Choose at least one feature' }),
    }
    setErrors(found)
    if (Object.keys(found).length || pending || !role) return
    onSubmit({ email: email.trim(), role, sections })
  }

  return (
    <form className="contents" onSubmit={submit} noValidate>
      <DialogBody className="flex flex-col gap-4">
        <FormField label="Email Address" htmlFor={`${id}-email`} error={errors.email ?? error}>
          <Input
            id={`${id}-email`}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              clear('email')
            }}
            placeholder="example@email.com"
            autoComplete="off"
            aria-invalid={!!(errors.email ?? error) || undefined}
            autoFocus={mode === 'invite'}
          />
        </FormField>

        <FormField label="Access Type" htmlFor={`${id}-role`} error={errors.role}>
          <Select
            value={role}
            onValueChange={(v) => {
              setRole(v as AccessRole)
              clear('role')
            }}
            defaultOpen={defaultSelectOpen}
          >
            <SelectTrigger id={`${id}-role`} aria-invalid={!!errors.role || undefined}>
              <SelectValue placeholder="Select access type" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ROLE_LABEL) as AccessRole[]).map((r) => (
                <SelectItem key={r} value={r} icon={ROLE_ICON[r]} description={ROLE_DESCRIPTION[r]}>
                  {ROLE_LABEL[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <fieldset className="mt-1 flex flex-col">
          <legend className="mb-1 text-eyebrow">Features</legend>
          {PARTNER_FEATURES.map((f) => (
            <label key={f.key} className="flex h-8.5 w-fit cursor-pointer items-center gap-2 text-foreground">
              <Checkbox checked={sections.includes(f.key)} onCheckedChange={(on) => toggle(f.key, on === true)} />
              {f.label}
            </label>
          ))}
          {errors.sections && <FieldError message={errors.sections} />}
        </fieldset>
      </DialogBody>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary" size="xs">
            Close
          </Button>
        </DialogClose>
        <Button type="submit" size="xs" loading={pending} loadingText={COPY[mode].pending}>
          {COPY[mode].submit}
        </Button>
      </DialogFooter>
    </form>
  )
}
