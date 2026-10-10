import { useState } from 'react'
import { LinkIcon, UploadIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { SegmentedTabs, SegmentedTabsContent, SegmentedTabsList, SegmentedTabsTrigger } from '@/components/ui/segmented-tabs'
import { MOCK_SHARE_LINK } from '../mock-data'
import type { Member, ShareOwner, SharePreview } from '../types'
import { ExportTab } from './export-tab'
import { InviteForm } from './invite-form'
import { ManageAccess } from './manage-access'
import { MemberRow } from './member-row'
import { RevokeAccess } from './revoke-access'
import { ShareLinkFooter } from './share-link-footer'

export type ShareTab = 'invite' | 'export'

/** What the modal shows: the tabs, or a sub-view for one person (reached from their role). */
export type ShareView = { kind: 'share' } | { kind: 'manage'; memberId: string } | { kind: 'revoke'; memberId: string }

/**
 * Share the portfolio: invite people (role + sections) and see who has access, or export a copy.
 * UI only for now — invites update the list inside the modal.
 */
export function ShareModal({
  open,
  onOpenChange,
  owner,
  shareLink = MOCK_SHARE_LINK,
  defaultTab = 'invite',
  defaultView = { kind: 'share' },
  defaultMembers = [],
  preview,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  owner: ShareOwner
  shareLink?: string
  defaultTab?: ShareTab
  /** Open straight on a sub-view (dev previews). */
  defaultView?: ShareView
  /** People besides the owner (dev previews); later from the API. */
  defaultMembers?: Member[]
  /** Dev gallery: start with text typed, a menu open, or the link copied. */
  preview?: SharePreview
}) {
  // Kept outside the dialog content so invites survive closing and reopening the modal.
  const [members, setMembers] = useState<Member[]>(defaultMembers)
  const [tab, setTab] = useState<ShareTab>(defaultTab)
  const [view, setView] = useState<ShareView>(defaultView)
  const ownerMember: Member = { id: 'owner', ...owner, role: 'owner', status: 'active', sections: [] }
  const selected = view.kind === 'share' ? undefined : members.find((m) => m.id === view.memberId)
  const toShare = () => setView({ kind: 'share' })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) toShare() // reopen on the tabs, not a sub-view
        onOpenChange(next)
      }}
    >
      <DialogContent size="sm" position="high" aria-describedby={undefined}>
        {view.kind === 'manage' && selected ? (
          <ManageAccess
            key={selected.id}
            member={selected}
            onBack={toShare}
            onSave={(patch) => {
              setMembers((list) => list.map((m) => (m.id === selected.id ? { ...m, ...patch } : m)))
              toShare()
            }}
            onRevoke={() => setView({ kind: 'revoke', memberId: selected.id })}
          />
        ) : view.kind === 'revoke' && selected ? (
          <RevokeAccess
            member={selected}
            onBack={() => setView({ kind: 'manage', memberId: selected.id })}
            onConfirm={() => {
              setMembers((list) => list.filter((m) => m.id !== selected.id))
              toShare()
            }}
          />
        ) : (
          <SegmentedTabs value={tab} onValueChange={(t) => setTab(t as ShareTab)} className="flex min-h-0 flex-col">
            <div className="flex shrink-0 flex-col gap-3 border-b border-border p-4">
              <DialogTitle>Share</DialogTitle>
              <SegmentedTabsList>
                <SegmentedTabsTrigger value="invite">
                  <LinkIcon aria-hidden />
                  Invite others
                </SegmentedTabsTrigger>
                <SegmentedTabsTrigger value="export">
                  <UploadIcon aria-hidden />
                  Export
                </SegmentedTabsTrigger>
              </SegmentedTabsList>
            </div>

            <SegmentedTabsContent value="invite" className="flex min-h-0 flex-col outline-none">
              <div className="flex min-h-0 flex-col gap-3 overflow-y-auto px-4 pt-4 pb-2">
                <InviteForm
                  preview={preview}
                  onInvite={(emails, role, sections) =>
                    setMembers((list) => [
                      ...list,
                      ...emails
                        .filter((email) => email !== owner.email && !list.some((m) => m.email === email))
                        .map((email): Member => ({ id: crypto.randomUUID(), email, role, status: 'invited', sections })),
                    ])
                  }
                />
                <div className="flex flex-col">
                  <span className="text-xs leading-5 text-muted-foreground">People</span>
                  <ul className="flex flex-col">
                    <MemberRow member={ownerMember} isYou />
                    {members.map((m) => (
                      <MemberRow key={m.id} member={m} onManage={() => setView({ kind: 'manage', memberId: m.id })} />
                    ))}
                  </ul>
                </div>
              </div>
              <ShareLinkFooter link={shareLink} defaultCopied={preview?.copied} />
            </SegmentedTabsContent>

            <SegmentedTabsContent value="export" className="flex min-h-0 flex-col outline-none">
              <ExportTab />
            </SegmentedTabsContent>
          </SegmentedTabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
