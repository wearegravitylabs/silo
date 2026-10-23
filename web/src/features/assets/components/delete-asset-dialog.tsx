import { ConfirmDialog } from '@/components/confirm-dialog'

/** Confirms deleting an asset from the portfolio. */
export function DeleteAssetDialog({
  open,
  onOpenChange,
  assetName,
  pending,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  assetName: string
  pending?: boolean
  onConfirm: () => void
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Asset"
      confirmLabel="Delete Asset"
      cancelLabel="Close"
      size="sm"
      position="high"
      descriptionClassName="text-sm leading-5.5"
      pending={pending}
      onConfirm={onConfirm}
    >
      You’re about to delete {assetName}. This removes it and its value from this portfolio permanently
    </ConfirmDialog>
  )
}
