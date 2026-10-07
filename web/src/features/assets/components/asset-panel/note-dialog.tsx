import { useState } from 'react'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useNoteMutations } from '../../queries'
import type { AssetNote } from '../../types'

/** Add or edit a note. Pass `note` to edit; the form resets each time it opens. */
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <NoteForm key={note?.id ?? 'new'} portfolioId={portfolioId} assetId={assetId} note={note} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function NoteForm({
  portfolioId,
  assetId,
  note,
  onDone,
}: {
  portfolioId: string
  assetId: string
  note: AssetNote | null
  onDone: () => void
}) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [tags, setTags] = useState((note?.tags?.items ?? []).join(', '))
  const { save } = useNoteMutations(portfolioId, assetId)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    save.mutate(
      {
        noteId: note?.id,
        title,
        content,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      },
      { onSuccess: onDone },
    )
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
        <Button type="submit" size="xs" disabled={!content.trim()} loading={save.isPending} loadingText="Saving…">
          {note ? 'Save Changes' : 'Add Note'}
        </Button>
      </DialogFooter>
    </form>
  )
}
