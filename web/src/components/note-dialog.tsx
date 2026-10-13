import { useState } from 'react'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export interface NoteValues {
  title: string
  content: string
  tags: string[]
}

/**
 * Add or edit a note (title, text, comma-separated tags). Pass `note` to edit; the form resets each time it opens.
 * `onSave` gets the trimmed values — close the dialog from the caller once it's saved.
 */
export function NoteDialog({
  note,
  open,
  onOpenChange,
  onSave,
  saving,
}: {
  note: (NoteValues & { id: string }) | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (values: NoteValues) => void
  saving?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <NoteForm key={note?.id ?? 'new'} note={note} onSave={onSave} saving={saving} />
      </DialogContent>
    </Dialog>
  )
}

function NoteForm({ note, onSave, saving }: { note: NoteValues | null; onSave: (values: NoteValues) => void; saving?: boolean }) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [tags, setTags] = useState((note?.tags ?? []).join(', '))

  const submit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!content.trim()) return
    onSave({
      title: title.trim(),
      content: content.trim(),
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    })
  }

  return (
    <form onSubmit={submit} className="contents">
      <DialogHeader>
        <DialogTitle>{note ? 'Edit Note' : 'Add Note'}</DialogTitle>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        <FormField label="Title" htmlFor="note-title">
          <Input
            id="note-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="border-transparent"
          />
        </FormField>
        <FormField label="Notes" htmlFor="note-content" required>
          <textarea
            id="note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note here…"
            className="h-30 w-full resize-none rounded-xl border border-transparent bg-surface px-4 py-2.5 leading-5.5 outline-none placeholder:text-subtle focus:border-primary"
          />
        </FormField>
        <FormField label="Tags" htmlFor="note-tags">
          <Input
            id="note-tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. Finance, Investment"
            className="border-transparent"
          />
        </FormField>
      </DialogBody>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary" size="xs">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" size="xs" disabled={!content.trim()} loading={saving} loadingText="Saving…">
          {note ? 'Save Changes' : 'Add Note'}
        </Button>
      </DialogFooter>
    </form>
  )
}
