import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DialogClose, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { firstName, ROLE_LABEL, SECTIONS } from '../mock-data'
import type { AccessRole, Member, SectionKey } from '../types'

/**
 * Change one person's role and sections. Save is enabled only once something differs from what they have.
 * Inside the Share modal it's a sub-view (`onBack`, plus a Revoke link); on its own it closes the dialog.
 */
export function ManageAccess({
  member,
  onBack,
  onSave,
  onRevoke,
  sections: options = SECTIONS,
  pending,
  titleClassName,
}: {
  member: Member
  /** Sub-view: ‹ back in the header, Close goes back. Without it: ✕ and Close shut the dialog. */
  onBack?: () => void
  onSave: (patch: { role: AccessRole; sections: SectionKey[] }) => void
  /** Shows the "Revoke Access" link in the footer */
  onRevoke?: () => void
  /** Sections offered, in order (default: all) */
  sections?: { key: SectionKey; label: string }[]
  pending?: boolean
  titleClassName?: string
}) {
  const [role, setRole] = useState<AccessRole>(member.role === 'owner' ? 'viewer' : member.role)
  const [sections, setSections] = useState<SectionKey[]>(member.sections)
  // Standalone (Settings → Partners) uses the tighter spacing of its own design.
  const sub = !!onBack
  const row = cn('flex h-8.5 cursor-pointer items-center text-foreground', sub ? 'gap-3' : 'gap-2')
  const dirty = role !== member.role || sections.length !== member.sections.length || sections.some((s) => !member.sections.includes(s))

  return (
    <>
      <DialogHeader onBack={onBack} closable={!onBack}>
        <DialogTitle className={cn('truncate', titleClassName)}>Manage Access - {firstName(member)}</DialogTitle>
      </DialogHeader>

      <div className="flex min-h-0 flex-col overflow-y-auto p-5 pt-4">
        <p>Manage access of this partner</p>

        <span className={cn('mb-1 text-eyebrow', sub ? 'mt-5' : 'mt-3')}>Access type</span>
        <RadioGroup value={role} onValueChange={(v) => setRole(v as AccessRole)} aria-label="Access type">
          {(Object.keys(ROLE_LABEL) as AccessRole[]).map((r) => (
            <label key={r} className={row}>
              <RadioGroupItem value={r} />
              {ROLE_LABEL[r]}
            </label>
          ))}
        </RadioGroup>

        <span className={cn('mb-1 text-eyebrow', sub ? 'mt-4' : 'mt-2')}>Features</span>
        <div className="flex flex-col">
          {options.map((s) => (
            <label key={s.key} className={row}>
              <Checkbox
                checked={sections.includes(s.key)}
                onCheckedChange={(on) =>
                  setSections((list) =>
                    on === true
                      ? SECTIONS.map((x) => x.key).filter((k) => k === s.key || list.includes(k))
                      : list.filter((k) => k !== s.key),
                  )
                }
              />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      <div
        className={cn('flex h-15 shrink-0 items-center gap-2 border-t border-border px-5', onRevoke ? 'justify-between' : 'justify-end')}
      >
        {onRevoke && (
          <button
            type="button"
            onClick={onRevoke}
            className="rounded-md text-xs font-semibold text-destructive transition-opacity outline-none hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            Revoke Access
          </button>
        )}
        <div className="flex items-center gap-2">
          {onBack ? (
            <Button variant="secondary" size="xs" onClick={onBack} className="shadow-small">
              Close
            </Button>
          ) : (
            <DialogClose asChild>
              <Button variant="secondary" size="xs" className="shadow-small">
                Close
              </Button>
            </DialogClose>
          )}
          <Button size="xs" disabled={!dirty} loading={pending} loadingText="Saving…" onClick={() => onSave({ role, sections })}>
            Save changes
          </Button>
        </div>
      </div>
    </>
  )
}
