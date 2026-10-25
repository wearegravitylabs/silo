import { useState } from 'react'
import { ColorPickerDisc } from '@/components/color-picker-disc'
import { FolderGlyph } from '@/components/folder-glyph'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { FOLDER_COLORS } from '@/lib/folders'
import type { FolderInput } from '../queries'

/**
 * Create Folder, or Edit Folder when `folder` is passed: the folder's glossy icon on a disc (the pipette picks its
 * colour) and its name. Create needs a name; Save Changes needs a change. The form resets each time it opens; close
 * it from the caller once `onSave` succeeds.
 */
export function FolderFormDialog({
  folder,
  open,
  onOpenChange,
  onSave,
  saving,
}: {
  folder?: FolderInput | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: FolderInput) => void
  saving?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        {open && <FolderForm folder={folder ?? null} onSave={onSave} saving={saving} />}
      </DialogContent>
    </Dialog>
  )
}

function FolderForm({ folder, onSave, saving }: { folder: FolderInput | null; onSave: (values: FolderInput) => void; saving?: boolean }) {
  const [name, setName] = useState(folder?.name ?? '')
  const [color, setColor] = useState(folder?.color ?? FOLDER_COLORS[0])
  const trimmed = name.trim()
  const changed = !folder || trimmed !== folder.name || color !== folder.color
  const valid = !!trimmed && changed

  return (
    <form
      className="contents"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) onSave({ name: trimmed, color })
      }}
    >
      <DialogHeader>
        <DialogTitle className="font-sans">{folder ? 'Edit Folder' : 'Create Folder'}</DialogTitle>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-7">
        <ColorPickerDisc
          colors={FOLDER_COLORS}
          value={color}
          onChange={setColor}
          label="Folder colour"
          className="size-26 self-center"
          badgeClassName="right-0.5 bottom-0.5"
        >
          <span className="flex size-full items-center justify-center rounded-full border border-border bg-background">
            <FolderGlyph className="h-13 w-16 transition-colors" style={{ color }} />
          </span>
        </ColorPickerDisc>
        <FormField label="Name" htmlFor="folder-name">
          <Input
            id="folder-name"
            autoFocus
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter folder name"
            className="border-transparent"
          />
        </FormField>
      </DialogBody>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary" size="xs">
            Close
          </Button>
        </DialogClose>
        <Button type="submit" size="xs" disabled={!valid} loading={saving} loadingText={folder ? 'Saving…' : 'Creating…'}>
          {folder ? 'Save Changes' : 'Create Folder'}
        </Button>
      </DialogFooter>
    </form>
  )
}
