import { ConfirmDialog } from '@/components/confirm-dialog'

/** Delete Debt – {name}: confirms removing a debt from the portfolio for good. */
export function DeleteDebtDialog({
  open,
  onOpenChange,
  debtName,
  pending,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  debtName: string
  pending?: boolean
  onConfirm: () => void
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete Debt - ${debtName}`}
      confirmLabel="Delete Debt"
      cancelLabel="Close"
      pending={pending}
      onConfirm={onConfirm}
    >
      You’re about to delete this debt. This means that this debt will be permanently removed. This action cannot be undone
    </ConfirmDialog>
  )
}
