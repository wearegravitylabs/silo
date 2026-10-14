import { ConfirmDialog } from '@/components/confirm-dialog'
import { useDeleteAsset } from '../../queries'
import type { AssetItem } from '../../types'

export function DeleteAssetDialog({
  asset,
  portfolioId,
  open,
  onOpenChange,
  onDeleted,
}: {
  asset: AssetItem
  portfolioId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}) {
  const { mutate: remove, isPending } = useDeleteAsset(portfolioId, asset.id)

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Delete ${asset.name}?`}
      confirmLabel="Delete Asset"
      pending={isPending}
      onConfirm={() => remove(undefined, { onSuccess: onDeleted })}
    >
      Are you sure you want to delete <strong className="font-semibold text-foreground">{asset.name}</strong>? This will permanently remove
      the asset and all its associated data including history, notes, and documents. This action cannot be undone.
    </ConfirmDialog>
  )
}
