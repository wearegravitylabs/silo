import { useState } from 'react'
import { useMemberMutations, useMembers } from '../queries'
import type { Member, ShareOwner } from '../types'
import { InvitePartnerDialog } from './invite-partner-dialog'
import { ManageAccessDialog } from './manage-access-dialog'
import { PartnersTable } from './partners-table'
import { RevokeMemberDialog } from './revoke-member-dialog'

type Action = { kind: 'invite' } | { kind: 'edit' | 'revoke'; member: Member } | null

/**
 * Body of Settings → Partners (inside a wide <SettingsPage>): the people table and its dialogs — invite,
 * edit/resend an invite, manage someone's access, revoke access or an invite.
 */
export function PartnersSettings({ portfolioId, owner }: { portfolioId: string; owner: ShareOwner & { joinedAt?: string } }) {
  const { data: members = [], isPending } = useMembers(portfolioId)
  const { invite, resend, update, revoke } = useMemberMutations(portfolioId)
  const [action, setAction] = useState<Action>(null)
  // The member stays on screen while its dialog animates closed.
  const [shown, setShown] = useState<Member | null>(null)
  const close = () => setAction(null)
  const act = (kind: 'edit' | 'revoke') => (member: Member) => {
    setShown(member)
    setAction({ kind, member })
  }

  const ownerRow: Member = {
    id: 'owner',
    name: owner.name,
    email: owner.email,
    avatarUrl: owner.avatarUrl,
    role: 'owner',
    status: 'active',
    sections: [],
    joined_at: owner.joinedAt,
  }
  const editing = action?.kind === 'edit'
  const revoking = action?.kind === 'revoke'
  const invited = shown?.status === 'invited'

  return (
    <>
      <PartnersTable
        owner={ownerRow}
        members={members}
        loading={isPending}
        onInvite={() => {
          invite.reset()
          setAction({ kind: 'invite' })
        }}
        onEdit={(m) => {
          resend.reset()
          act('edit')(m)
        }}
        onRevoke={act('revoke')}
      />

      <InvitePartnerDialog
        open={action?.kind === 'invite'}
        onOpenChange={(open) => !open && close()}
        pending={invite.isPending}
        error={invite.error?.message}
        onSubmit={(input) => invite.mutate(input, { onSuccess: close })}
      />

      {/* Open invites are edited and resent; people who joined get Manage Access */}
      <InvitePartnerDialog
        mode="edit"
        open={editing && invited}
        onOpenChange={(open) => !open && close()}
        initial={shown ?? undefined}
        pending={resend.isPending}
        error={resend.error?.message}
        onSubmit={(input) => shown && resend.mutate({ id: shown.id, ...input }, { onSuccess: close })}
      />
      <ManageAccessDialog
        member={shown}
        open={editing && !invited}
        onOpenChange={(open) => !open && close()}
        pending={update.isPending}
        onSave={(patch) => shown && update.mutate({ id: shown.id, ...patch }, { onSuccess: close })}
      />

      <RevokeMemberDialog
        member={shown}
        open={revoking}
        onOpenChange={(open) => !open && close()}
        pending={revoke.isPending}
        onConfirm={() => shown && revoke.mutate(shown.id, { onSuccess: close })}
      />
    </>
  )
}
