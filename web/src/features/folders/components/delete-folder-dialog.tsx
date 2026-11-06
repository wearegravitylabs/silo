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
 * Delete Folder – {name}: pick the folder its items move to (a default folder, else the first, to start with), then
 * delete. `folders` are the other folders, already coloured. Items always need a folder, so the only folder can be
 * deleted only once it's empty.
 */
export function DeleteFolderDialog({
  folder,
  folders,
  defaultId,
  count = 0,
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
  /** Items in the folder being deleted */
  count?: number
  counts?: Record<string, number>
  /** Singular, capitalised ("Asset") */
  noun: string
  open: boolean
  onOpenChange: (open: boolean) => void
  pending?: boolean
  /** With the folder its items go to; null when there's no other folder */
  onConfirm: (moveTo: string | null) => void
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
          count={count}
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
  count,
  counts,
  noun,
  pending,
  onConfirm,
}: {
  name: string
  folders: Array<Pick<Folder, 'id' | 'name' | 'color'>>
  defaultId: string
  count: number
  counts?: Record<string, number>
  noun: string
  pending?: boolean
  onConfirm: (moveTo: string | null) => void
}) {
  const [moveTo, setMoveTo] = useState(() => (folders.some((f) => f.id === defaultId) ? defaultId : (folders[0]?.id ?? null)))
  const items = `${noun.toLowerCase()}${count === 1 ? '' : 's'}`
  // The only folder, with items left in it: they'd have nowhere to go.
  const stuck = !moveTo && count > 0
  return (
    <>
      <DialogHeader>
        <DialogTitle className="truncate font-sans">Delete Folder - {name}</DialogTitle>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-5">
        {folders.length > 0 ? (
          <>
            <DialogDescription>
              You’re about to delete this folder. Select the folder you would like to move {noun.toLowerCase()}s in this folder to. This
              action cannot be undone
            </DialogDescription>
            <FolderChoiceList folders={folders} value={moveTo} onChange={setMoveTo} counts={counts} noun={noun} label="Move to folder" />
          </>
        ) : stuck ? (
          <DialogDescription>
            This is your only folder, and every {noun.toLowerCase()} needs one. Create another folder to move its {count} {items} to, or
            delete them, before deleting this folder.
          </DialogDescription>
        ) : (
          <DialogDescription>You’re about to delete this folder. This action cannot be undone</DialogDescription>
        )}
      </DialogBody>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary" size="xs">
            Close
          </Button>
        </DialogClose>
        <Button
          variant="destructive"
          size="xs"
          disabled={stuck}
          loading={pending}
          loadingText="Deleting…"
          onClick={() => onConfirm(moveTo)}
        >
          Delete Folder
        </Button>
      </DialogFooter>
    </>
  )
}
