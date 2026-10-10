import { Button } from '@/components/ui/button'
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { firstName } from '../mock-data'
import type { Member } from '../types'

/** Confirm removing someone's access. */
export function RevokeAccess({ member, onBack, onConfirm }: { member: Member; onBack: () => void; onConfirm: () => void }) {
  const name = firstName(member)
  return (
    <>
      <DialogHeader onBack={onBack} closable={false}>
        <DialogTitle className="truncate">Revoke Access - {name}</DialogTitle>
      </DialogHeader>

      <DialogDescription className="px-5 py-4 text-sm leading-5.5">
        You&apos;re about to revoke {name}&apos;s access. {name} will no longer have access to this portfolio.
      </DialogDescription>

      <div className="flex h-15 shrink-0 items-center justify-end gap-2 border-t border-border px-5">
        <Button variant="secondary" size="xs" onClick={onBack} className="shadow-small">
          Close
        </Button>
        <Button variant="destructive" size="xs" onClick={onConfirm}>
          Revoke Access
        </Button>
      </div>
    </>
  )
}
