import { ConfirmDialog } from '@/components/confirm-dialog'

/** Confirms ending the free trial early. */
export function EndTrialDialog({
  open,
  onOpenChange,
  trialDays,
  pending,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  trialDays: number
  pending?: boolean
  onConfirm: () => void
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="End Trial"
      confirmLabel="End Trial"
      pendingLabel="Ending…"
      cancelLabel="Close"
      size="sm"
      position="high"
      descriptionClassName="text-sm leading-5.5"
      pending={pending}
      onConfirm={onConfirm}
    >
      You’re about to end your {trialDays}-days trial. This means that you are ready to use our premium plan
    </ConfirmDialog>
  )
}
