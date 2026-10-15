import { Dialog, DialogContent } from '@/components/ui/dialog'
import { PARTNER_FEATURES } from '../mock-data'
import type { AccessRole, Member, SectionKey } from '../types'
import { ManageAccess } from './manage-access'

/** Manage Access on its own (Settings → Partners): role + features, Save once something changes. */
export function ManageAccessDialog({
  member,
  open,
  onOpenChange,
  pending,
  onSave,
}: {
  member: Member | null
  open: boolean
  onOpenChange: (open: boolean) => void
  pending?: boolean
  onSave: (patch: { role: AccessRole; sections: SectionKey[] }) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" position="high" aria-describedby={undefined}>
        {member && (
          <ManageAccess
            key={member.id}
            member={member}
            sections={PARTNER_FEATURES}
            titleClassName="font-sans"
            pending={pending}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
