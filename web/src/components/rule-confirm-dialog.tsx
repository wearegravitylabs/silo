import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { toastDone } from '@/components/ui/sonner'

export type RuleConfirm = 'pause' | 'resume' | 'delete'

const COPY: Record<RuleConfirm, { title: string; body: string; pending: string }> = {
  pause: {
    title: 'Pause Rule',
    body: 'You’re about to pause this rule. This means that this Auto-Pilot Rule will not be active until it is resumed',
    pending: 'Pausing…',
  },
  resume: {
    title: 'Resume Rule',
    body: 'You’re about to resume this rule. This means that this Auto-Pilot Rule will become active',
    pending: 'Resuming…',
  },
  delete: {
    title: 'Delete Rule',
    body: 'You’re about to delete this rule. This means that this Auto-Pilot Rule will be permanently removed. This action cannot be undone',
    pending: 'Deleting…',
  },
}

/** Confirms pausing, resuming (blue) or deleting (red) an Auto-Pilot rule. Keep `action` set while it closes. */
export function RuleConfirmDialog({
  action,
  open,
  onOpenChange,
  pending,
  onConfirm,
}: {
  action: RuleConfirm
  open: boolean
  onOpenChange: (open: boolean) => void
  pending?: boolean
  onConfirm: () => void
}) {
  const copy = COPY[action]
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={copy.title}
      confirmLabel={copy.title}
      pendingLabel={copy.pending}
      cancelLabel="Close"
      tone={action === 'delete' ? 'destructive' : 'primary'}
      pending={pending}
      onConfirm={onConfirm}
    >
      {copy.body}
    </ConfirmDialog>
  )
}

const DONE: Record<RuleConfirm, string> = {
  pause: 'Rule has been paused successfully!',
  resume: 'Rule has been resumed successfully!',
  delete: 'Rule has been deleted successfully!',
}

/**
 * The confirm step for a rule list's ⋯ actions: `ask(rule, 'pause' | 'resume' | 'delete')` opens the dialog;
 * confirming runs `toggle` or `remove` (call `done` once it's saved), closes it and toasts (green, dark for a delete).
 */
export function useRuleConfirm<R>({
  toggle,
  remove,
  pending,
}: {
  toggle: (rule: R, done: () => void) => void
  remove: (rule: R, done: () => void) => void
  pending: boolean
}) {
  // Kept while the dialog closes, so its copy doesn't change mid-animation.
  const [state, setState] = useState<{ rule: R; action: RuleConfirm; open: boolean } | null>(null)

  const confirm = () => {
    if (!state) return
    const { rule, action } = state
    const done = () => {
      setState((s) => s && { ...s, open: false })
      if (action === 'delete') toastDone(DONE.delete)
      else toast.success(DONE[action])
    }
    if (action === 'delete') remove(rule, done)
    else toggle(rule, done)
  }

  return {
    ask: (rule: R, action: RuleConfirm) => setState({ rule, action, open: true }),
    dialog: (
      <RuleConfirmDialog
        action={state?.action ?? 'pause'}
        open={!!state?.open}
        onOpenChange={(open) => setState((s) => s && { ...s, open })}
        pending={pending}
        onConfirm={confirm}
      />
    ),
  }
}
