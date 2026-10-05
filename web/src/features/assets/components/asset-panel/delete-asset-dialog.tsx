import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent role="alertdialog">
        <DialogHeader>
          <DialogTitle>Delete {asset.name}?</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>
            Are you sure you want to delete <strong className="font-semibold text-foreground">{asset.name}</strong>? This will permanently
            remove the asset and all its associated data including history, notes, and documents. This action cannot be undone.
          </DialogDescription>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" size="xs">
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" size="xs" disabled={isPending} onClick={() => remove(undefined, { onSuccess: onDeleted })}>
            {isPending ? 'Deleting…' : 'Delete Asset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
