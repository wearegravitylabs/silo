import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ALL_SECTIONS, ROLE_LABEL } from '../mock-data'
import type { AccessRole, SectionKey, SharePreview } from '../types'
import { AccessSelect } from './access-select'
import { RoleMenu } from './role-menu'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const parseEmails = (raw: string) => raw.split(/[\s,;]+/).filter(Boolean)

/**
 * Email field (comma-separated) with the role picker inside it, and Invite. Once something is typed,
 * "<Role> access" appears with the section picker.
 */
export function InviteForm({
  onInvite,
  preview,
}: {
  onInvite: (emails: string[], role: AccessRole, sections: SectionKey[]) => void
  preview?: SharePreview
}) {
  const [raw, setRaw] = useState(preview?.inviteText ?? '')
  const [role, setRole] = useState<AccessRole>('viewer')
  const [sections, setSections] = useState<SectionKey[]>(preview?.sections ?? ALL_SECTIONS)

  const emails = parseEmails(raw)
  const valid = emails.length > 0 && emails.every((e) => EMAIL_RE.test(e))
  const typing = raw.trim().length > 0

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        onInvite(emails, role, sections)
        setRaw('')
      }}
      className="flex flex-col gap-2"
    >
      <div className="flex items-center gap-2">
        <label
          className={cn(
            'flex h-7.5 min-w-0 flex-1 items-center gap-2 rounded-lg border border-transparent bg-surface px-3 transition-colors',
            'focus-within:border-primary focus-within:bg-background',
          )}
        >
          <input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="Email, separated by commas"
            aria-label="Emails to invite"
            className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-subtle"
          />
          {typing && <RoleMenu value={role} onChange={setRole} defaultOpen={preview?.openMenu === 'role'} />}
        </label>
        <Button type="submit" size="xs" disabled={!valid} className="h-7.5 px-2.5">
          Invite
        </Button>
      </div>

      {typing && (
        <div className="flex animate-rise flex-col gap-0.5">
          <span className="text-xs leading-5 text-muted-foreground">{ROLE_LABEL[role]} access</span>
          <AccessSelect value={sections} onChange={setSections} defaultOpen={preview?.openMenu === 'access'} />
        </div>
      )}
    </form>
  )
}
