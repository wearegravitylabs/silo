import { ConfirmDialog } from '@/components/confirm-dialog'
import { firstName } from '../mock-data'
import type { Member } from '../types'

/** Confirm removing someone who joined ("Revoke Access - Taiwo") or cancelling an open invite ("Revoke Invite"). */
export function RevokeMemberDialog({
  member,
  open,
  onOpenChange,
  pending,
  onConfirm,
}: {
  member: Member | null
  open: boolean
  onOpenChange: (open: boolean) => void
  pending?: boolean
  onConfirm: () => void
}) {
  const invited = member?.status === 'invited'
  const name = member ? firstName(member) : ''
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      position="high"
      descriptionClassName="text-sm leading-5.5"
      title={invited ? 'Revoke Invite' : `Revoke Access - ${name}`}
      cancelLabel="Close"
      confirmLabel={invited ? 'Revoke Invite' : 'Revoke Access'}
      pendingLabel="Revoking…"
      pending={pending}
      onConfirm={onConfirm}
    >
      {invited
        ? 'You’re about to revoke this invite. This means that the partner will no longer be able to use the invite sent to access this portfolio'
        : `You’re about to revoke ${name}’s access. This means that ${name} will no longer have access to this portfolio`}
    </ConfirmDialog>
  )
}
