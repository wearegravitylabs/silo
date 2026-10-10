import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { firstName, ROLE_LABEL, SECTIONS } from '../mock-data'
import type { AccessRole, Member, SectionKey } from '../types'

/** Change one person's role and sections. Save is enabled only once something differs from what they have. */
export function ManageAccess({
  member,
  onBack,
  onSave,
  onRevoke,
}: {
  member: Member
  onBack: () => void
  onSave: (patch: { role: AccessRole; sections: SectionKey[] }) => void
  onRevoke: () => void
}) {
  const [role, setRole] = useState<AccessRole>(member.role === 'owner' ? 'viewer' : member.role)
  const [sections, setSections] = useState<SectionKey[]>(member.sections)
  const dirty = role !== member.role || sections.length !== member.sections.length || sections.some((s) => !member.sections.includes(s))

  return (
    <>
      <DialogHeader onBack={onBack} closable={false}>
        <DialogTitle className="truncate">Manage Access - {firstName(member)}</DialogTitle>
      </DialogHeader>

      <div className="flex min-h-0 flex-col overflow-y-auto p-5 pt-4">
        <p>Manage access of this partner</p>

        <span className="mt-5 mb-1 text-eyebrow">Access type</span>
        <RadioGroup value={role} onValueChange={(v) => setRole(v as AccessRole)} aria-label="Access type">
          {(Object.keys(ROLE_LABEL) as AccessRole[]).map((r) => (
            <label key={r} className="flex h-8.5 cursor-pointer items-center gap-3 text-foreground">
              <RadioGroupItem value={r} />
              {ROLE_LABEL[r]}
            </label>
          ))}
        </RadioGroup>

        <span className="mt-4 mb-1 text-eyebrow">Features</span>
        <div className="flex flex-col">
          {SECTIONS.map((s) => (
            <label key={s.key} className="flex h-8.5 cursor-pointer items-center gap-3 text-foreground">
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

      <div className="flex h-15 shrink-0 items-center justify-between gap-2 border-t border-border px-5">
        <button
          type="button"
          onClick={onRevoke}
          className="rounded-md text-xs font-semibold text-destructive transition-opacity outline-none hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          Revoke Access
        </button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="xs" onClick={onBack} className="shadow-small">
            Close
          </Button>
          <Button size="xs" disabled={!dirty} onClick={() => onSave({ role, sections })}>
            Save changes
          </Button>
        </div>
      </div>
    </>
  )
}
