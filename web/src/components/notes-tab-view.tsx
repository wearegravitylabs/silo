import { useState } from 'react'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { EntryAction, EntryCard } from '@/components/entry-card'
import { PlusCircleIcon } from '@/components/icons'
import { NoteDialog, type NoteValues } from '@/components/note-dialog'
import { TabBody, TabCta, TabEmpty, TabListSkeleton } from '@/components/panel-layout'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'

export interface PanelNote extends NoteValues {
  id: string
  created_at: string
}

/**
 * Note tab of a detail panel (asset, debt): the notes (edit, delete) and Add Note. The caller owns the data;
 * `onSave` gets the note id when editing and should call `done` once saved.
 */
export function NotesTabView({
  notes,
  loading,
  saving,
  onSave,
  onDelete,
}: {
  notes: PanelNote[] | undefined
  loading: boolean
  saving: boolean
  onSave: (values: NoteValues & { noteId?: string }, done: () => void) => void
  onDelete: (noteId: string) => void
}) {
  const [dialog, setDialog] = useState<{ open: boolean; note: PanelNote | null }>({ open: false, note: null })
  const close = () => setDialog((d) => ({ ...d, open: false }))

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
                    <EntryAction label="Delete note" tone="danger" onClick={() => onDelete(note.id)}>
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
        onSave={(values) => onSave({ noteId: dialog.note?.id, ...values }, close)}
      />
    </div>
  )
}
