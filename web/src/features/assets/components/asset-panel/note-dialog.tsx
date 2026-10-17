import { NoteDialog as NoteFormDialog } from '@/components/note-dialog'
import { useNoteMutations } from '../../queries'
import type { AssetNote } from '../../types'

/** Add or edit a note on an asset. Pass `note` to edit; the form resets each time it opens. */
export function NoteDialog({
  portfolioId,
  assetId,
  note,
  open,
  onOpenChange,
}: {
  portfolioId: string
  assetId: string
  note: AssetNote | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { save } = useNoteMutations(portfolioId, assetId)

  return (
    <NoteFormDialog
      note={note && { id: note.id, title: note.title, content: note.content, tags: note.tags?.items ?? [] }}
      open={open}
      onOpenChange={onOpenChange}
      saving={save.isPending}
      onSave={(values) => save.mutate({ noteId: note?.id, ...values }, { onSuccess: () => onOpenChange(false) })}
    />
  )
}
