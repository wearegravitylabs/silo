import { useState } from 'react'
import { FolderChoiceList } from '@/components/folder-choice-list'
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
import type { Folder } from '../types'

/**
 * Delete Folder – {name}: pick the folder its items move to (the default folder to start with), then delete.
 * `folders` are the other folders, already coloured.
 */
export function DeleteFolderDialog({
  folder,
  folders,
  defaultId,
  counts,
  noun,
  open,
  onOpenChange,
  pending,
  onConfirm,
}: {
  /** The folder being deleted; kept while the dialog closes */
  folder: Folder | null
  folders: Array<Pick<Folder, 'id' | 'name' | 'color'>>
  defaultId: string
  counts?: Record<string, number>
  /** Singular, capitalised ("Asset") */
  noun: string
  open: boolean
  onOpenChange: (open: boolean) => void
  pending?: boolean
  onConfirm: (moveTo: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent role="alertdialog">
        {/* Keyed so each open starts on the default folder */}
        <DeleteFolderBody
          key={folder?.id}
          name={folder?.name ?? ''}
          folders={folders}
          defaultId={defaultId}
          counts={counts}
          noun={noun}
          pending={pending}
          onConfirm={onConfirm}
        />
      </DialogContent>
    </Dialog>
  )
}

function DeleteFolderBody({
  name,
  folders,
  defaultId,
  counts,
  noun,
  pending,
  onConfirm,
}: {
  name: string
  folders: Array<Pick<Folder, 'id' | 'name' | 'color'>>
  defaultId: string
  counts?: Record<string, number>
  noun: string
  pending?: boolean
  onConfirm: (moveTo: string) => void
}) {
  const [moveTo, setMoveTo] = useState(defaultId)
  return (
    <>
      <DialogHeader>
        <DialogTitle className="truncate font-sans">Delete Folder - {name}</DialogTitle>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-5">
        <DialogDescription>
          You’re about to delete this folder. Select the folder you would like to move {noun.toLowerCase()}s in this folder to. This action
          cannot be undone
        </DialogDescription>
        <FolderChoiceList folders={folders} value={moveTo} onChange={setMoveTo} counts={counts} noun={noun} label="Move to folder" />
      </DialogBody>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary" size="xs">
            Close
          </Button>
        </DialogClose>
        <Button variant="destructive" size="xs" loading={pending} loadingText="Deleting…" onClick={() => onConfirm(moveTo)}>
          Delete Folder
        </Button>
      </DialogFooter>
    </>
  )
}
