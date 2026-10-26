import { ConfirmDialog } from '@/components/confirm-dialog'

/** Delete Asset – {name}: confirms removing an asset from the portfolio for good. */
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
      title={`Delete Asset - ${assetName}`}
      confirmLabel="Delete Asset"
      cancelLabel="Close"
      pending={pending}
      onConfirm={onConfirm}
    >
      You’re about to delete this asset. This means that this asset will be permanently removed. This action cannot be undone
    </ConfirmDialog>
  )
}
