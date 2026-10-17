import { DeletionCodeDialog } from '@/components/deletion-code-dialog'

/** Confirms deleting a portfolio with the code emailed to the owner (`email`) and an acknowledgement. */
export function DeletePortfolioDialog({
  open,
  onOpenChange,
  portfolioName,
  email,
  pending,
  invalid,
  onConfirm,
  onReset,
  defaultCode,
  defaultAcknowledged,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolioName: string
  email: string
  pending?: boolean
  invalid?: boolean
  onConfirm: (code: string) => void
  onReset?: () => void
  /** Dev gallery: open with a code typed / the box ticked. */
  defaultCode?: string
  defaultAcknowledged?: boolean
}) {
  return (
    <DeletionCodeDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete Portfolio - ${portfolioName}`}
      warning="You’re about to delete this portfolio. This means that all portfolio data and partners will be deleted permanently"
      email={email}
      acknowledgement="I acknowledge that all of the portfolio data will be deleted and want to proceed."
      confirmLabel="Delete Portfolio"
      size="sm"
      position="high"
      descriptionClassName="text-sm leading-5.5"
      pending={pending}
      invalid={invalid}
      onConfirm={onConfirm}
      onReset={onReset}
      defaultCode={defaultCode}
      defaultAcknowledged={defaultAcknowledged}
    />
  )
}
