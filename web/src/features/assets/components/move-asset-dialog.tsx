import { useState } from 'react'
import { FolderChoiceList } from '@/components/folder-choice-list'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { FolderRef } from '../types'

/**
 * Move Folders: "Folders (n)" with an Add Folder card, then a card per folder, the asset's own ticked. Save Changes
 * once another is picked. `selectedId` preselects a folder instead (e.g. one just made with Add Folder).
 */
export function MoveAssetDialog({
  assetId,
  currentId,
  selectedId,
  folders,
  counts,
  open,
  onOpenChange,
  pending,
  onMove,
  onAddFolder,
}: {
  /** The asset being moved; kept while the dialog closes */
  assetId: string | null
  /** The folder it's filed in (the default folder when unfiled) */
  currentId: string
  selectedId?: string | null
  folders: FolderRef[]
  counts?: Record<string, number>
  open: boolean
  onOpenChange: (open: boolean) => void
  pending?: boolean
  onMove: (folderId: string) => void
  onAddFolder?: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        {/* Remounted per asset (and per preselected folder), so the pick starts over */}
        <MoveBody
          key={`${assetId}:${selectedId ?? ''}`}
          currentId={currentId}
          initialId={selectedId ?? currentId}
          folders={folders}
          counts={counts}
          pending={pending}
          onMove={onMove}
          onAddFolder={onAddFolder}
        />
      </DialogContent>
    </Dialog>
  )
}

function MoveBody({
  currentId,
  initialId,
  folders,
  counts,
  pending,
  onMove,
  onAddFolder,
}: {
  currentId: string
  initialId: string
  folders: FolderRef[]
  counts?: Record<string, number>
  pending?: boolean
  onMove: (folderId: string) => void
  onAddFolder?: () => void
}) {
  const [picked, setPicked] = useState(initialId)
  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-sans">Folders ({folders.length})</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <FolderChoiceList
          folders={folders}
          value={picked}
          onChange={setPicked}
          counts={counts}
          noun="Asset"
          onAdd={onAddFolder}
          label="Move to folder"
        />
      </DialogBody>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary" size="xs">
            Close
          </Button>
        </DialogClose>
        <Button size="xs" disabled={picked === currentId} loading={pending} loadingText="Saving…" onClick={() => onMove(picked)}>
          Save Changes
        </Button>
      </DialogFooter>
    </>
  )
}
