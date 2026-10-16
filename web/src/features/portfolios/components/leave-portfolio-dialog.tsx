import { ConfirmDialog } from '@/components/confirm-dialog'

/** Confirms leaving a portfolio as a partner. */
export function LeavePortfolioDialog({
  open,
  onOpenChange,
  portfolioName,
  pending,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolioName: string
  pending?: boolean
  onConfirm: () => void
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Leave Portfolio - ${portfolioName}`}
      confirmLabel="Leave Portfolio"
      pendingLabel="Leaving…"
      cancelLabel="Close"
      size="sm"
      position="high"
      descriptionClassName="text-sm leading-5.5"
      pending={pending}
      onConfirm={onConfirm}
    >
      You’re about to leave this portfolio. This means that you no longer want to be a partner in this portfolio
    </ConfirmDialog>
  )
}
