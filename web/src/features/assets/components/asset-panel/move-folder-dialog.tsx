import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useUpdateAsset } from '../../queries'
import type { AssetItem, FolderRef } from '../../types'

const FOLDER_FILLS = ['text-folder-1', 'text-folder-2', 'text-folder-3', 'text-folder-4', 'text-folder-5', 'text-folder-6']

/** Pick a different folder for an asset. Counts come from the portfolio-wide asset list. */
export function MoveFolderDialog({
  asset,
  portfolioId,
  folders,
  allAssets,
  open,
  onOpenChange,
}: {
  asset: AssetItem
  portfolioId: string
  folders: FolderRef[]
  allAssets: AssetItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [target, setTarget] = useState(asset.folder_id)
  const { mutate: move, isPending } = useUpdateAsset(portfolioId, asset.id)
  const counts = Object.groupBy(allAssets, (a) => a.folder_id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Move to Folder</DialogTitle>
        </DialogHeader>
        <DialogBody role="radiogroup" aria-label="Folders" className="flex flex-col gap-2">
          {folders.map((folder, i) => {
            const count = counts[folder.id]?.length ?? 0
            const selected = target === folder.id
            return (
              <button
                key={folder.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTarget(folder.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-[border-color,box-shadow] duration-150',
                  selected ? 'border-primary-dark ring-2 ring-primary-subtle' : 'border-border',
                )}
              >
                <span className="flex flex-1 items-center gap-4">
                  <FolderGlyph className={FOLDER_FILLS[i % FOLDER_FILLS.length]} />
                  <span className="flex flex-col gap-1.5">
                    <span className="leading-5.5 font-medium">{folder.name}</span>
                    <span className="text-xs leading-5 text-muted-foreground">
                      {count} {count === 1 ? 'asset' : 'assets'}
                    </span>
                  </span>
                </span>
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                  className={cn('size-4 shrink-0 text-primary-dark', !selected && 'opacity-0')}
                >
                  <path d="M2 8l4.5 4.5L14 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )
          })}
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" size="xs">
              Cancel
            </Button>
          </DialogClose>
          <Button
            size="xs"
            disabled={target === asset.folder_id}
            loading={isPending}
            loadingText="Moving…"
            onClick={() => move({ folder_id: target }, { onSuccess: () => onOpenChange(false) })}
          >
            Move to Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Folder shape in the folder's colour, shading darker toward the bottom. */
function FolderGlyph({ className }: { className: string }) {
  const d = 'M2 12a3 3 0 013-3h10.5l3 3H35a3 3 0 013 3v16a3 3 0 01-3 3H5a3 3 0 01-3-3V12z'
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className={cn('size-10 shrink-0', className)}>
      <path d={d} fill="currentColor" />
      <path d={d} className="fill-ink/20 [mask:linear-gradient(transparent,black)]" />
    </svg>
  )
}
