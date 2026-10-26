import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { EntryAction, EntryCard } from '@/components/entry-card'
import { PlusCircleIcon } from '@/components/icons'
import { NoteDialog, type NoteValues } from '@/components/note-dialog'
import { TabBody, TabCta, TabEmpty, TabListSkeleton } from '@/components/panel-layout'
import { Button } from '@/components/ui/button'
import { toastDone } from '@/components/ui/sonner'
import { formatDate } from '@/lib/format'

export interface PanelNote extends NoteValues {
  id: string
  created_at: string
}

/**
 * Note tab of a detail panel (asset, debt): the notes (edit, delete after a confirm) and Add Note, with toasts. The
 * caller owns the data; `onSave` gets the note id when editing; both handlers call `done` once saved.
 */
export function NotesTabView({
  notes,
  loading,
  saving,
  deletePending,
  onSave,
  onDelete,
}: {
  notes: PanelNote[] | undefined
  loading: boolean
  saving: boolean
  deletePending?: boolean
  onSave: (values: NoteValues & { noteId?: string }, done: () => void) => void
  /** Call `done` once it's deleted */
  onDelete: (noteId: string, done: () => void) => void
}) {
  const [dialog, setDialog] = useState<{ open: boolean; note: PanelNote | null }>({ open: false, note: null })
  // Kept while the confirm closes.
  const [deleting, setDeleting] = useState<{ id: string; open: boolean } | null>(null)
  const saved = () => {
    setDialog((d) => ({ ...d, open: false }))
    toast.success(dialog.note ? 'Note has been updated successfully!' : 'Note has been added successfully!')
  }

  return (
    <div className="flex flex-1 flex-col">
      <TabBody className="overflow-y-visible">
        {loading ? (
          <TabListSkeleton rows={2} className="h-28" />
        ) : !notes?.length ? (
          <TabEmpty title="No Note Yet" body="Once you add a note, it will appear here" bodyClassName="max-w-64" />
        ) : (
          <div className="flex flex-col gap-2.5">
            {notes.map((note) => (
              <EntryCard
                key={note.id}
                label={`Added ${formatDate(note.created_at)}`}
                actions={
                  <>
                    <EntryAction label="Edit note" onClick={() => setDialog({ open: true, note })}>
                      <PencilIcon className="size-3.5" />
                    </EntryAction>
                    <EntryAction label="Delete note" tone="danger" onClick={() => setDeleting({ id: note.id, open: true })}>
                      <Trash2Icon className="size-3.5" />
                    </EntryAction>
                  </>
                }
              >
                {note.title && <span className="font-medium text-foreground">{note.title}</span>}
                <p className="text-xs leading-5 whitespace-pre-line">{note.content}</p>
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex h-5 items-center rounded-md border-[0.5px] border-line bg-accent px-1.5 text-xs text-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </EntryCard>
            ))}
          </div>
        )}
      </TabBody>

      <TabCta floating>
        <Button onClick={() => setDialog({ open: true, note: null })}>
          <PlusCircleIcon className="text-white" />
          Add Note
        </Button>
      </TabCta>

      <NoteDialog
        note={dialog.note}
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        saving={saving}
        onSave={(values) => onSave({ noteId: dialog.note?.id, ...values }, saved)}
      />
      <ConfirmDialog
        open={!!deleting?.open}
        onOpenChange={(open) => setDeleting((d) => d && { ...d, open })}
        title="Delete Note"
        confirmLabel="Delete Note"
        cancelLabel="Close"
        pending={deletePending}
        onConfirm={() =>
          deleting &&
          onDelete(deleting.id, () => {
            setDeleting((d) => d && { ...d, open: false })
            toastDone('Note has been deleted successfully!')
          })
        }
      >
        You’re about to delete this note. This means that this Note will be permanently removed. This action cannot be undone
      </ConfirmDialog>
    </div>
  )
}
