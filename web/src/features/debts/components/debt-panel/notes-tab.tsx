import { useState } from 'react'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { EntryAction, EntryCard } from '@/components/entry-card'
import { PlusCircleIcon } from '@/components/icons'
import { NoteDialog } from '@/components/note-dialog'
import { TabBody, TabCta, TabEmpty, TabListSkeleton } from '@/components/panel-layout'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import { useDebtNoteMutations, useDebtNotes } from '../../queries'
import type { Debt, DebtNote } from '../../types'

/** Note tab: the debt's notes (edit, delete) and Add Note. */
export function NotesTab({ debt, portfolioId }: { debt: Debt; portfolioId: string }) {
  const [dialog, setDialog] = useState<{ open: boolean; note: DebtNote | null }>({ open: false, note: null })
  const { data: notes, isPending } = useDebtNotes(portfolioId, debt.id)
  const { save, remove } = useDebtNoteMutations(portfolioId, debt.id)
  const close = () => setDialog((d) => ({ ...d, open: false }))

  return (
    <div className="flex flex-1 flex-col">
      <TabBody className="overflow-y-visible">
        {isPending ? (
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
                    <EntryAction label="Delete note" tone="danger" onClick={() => remove.mutate(note.id)}>
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
        saving={save.isPending}
        onSave={(values) => save.mutate({ noteId: dialog.note?.id, ...values }, { onSuccess: close })}
      />
    </div>
  )
}
