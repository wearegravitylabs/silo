import { useState } from 'react'
import { XIcon } from 'lucide-react'
import { FormField } from '@/components/form-field'
import { InfoDotIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export interface NoteValues {
  title: string
  content: string
  tags: string[]
}

const MAX_TAGS = 4

/**
 * Add or edit a note: title, body and up to 4 tags (type one and press Enter; × removes it). Pass `note` to edit —
 * Save Changes needs a change. The form resets each time it opens; `onSave` gets the trimmed values — close the
 * dialog from the caller once it's saved.
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
      <DialogContent aria-describedby={undefined}>{open && <NoteForm note={note} onSave={onSave} saving={saving} />}</DialogContent>
    </Dialog>
  )
}

function NoteForm({ note, onSave, saving }: { note: NoteValues | null; onSave: (values: NoteValues) => void; saving?: boolean }) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [tags, setTags] = useState<string[]>(note?.tags ?? [])
  const [tagText, setTagText] = useState('')
  const [tagsFocused, setTagsFocused] = useState(false)

  const values = { title: title.trim(), content: content.trim(), tags }
  const changed = !note || values.title !== note.title || values.content !== note.content || tags.join('\n') !== note.tags.join('\n')
  const valid = !!values.content && changed
  // The tag limit shows once you start filling the note in.
  const showHint = tagsFocused || !!(title || content || tagText || tags.length)
  const full = tags.length >= MAX_TAGS

  const addTag = () => {
    const tag = tagText.trim()
    if (!tag || full) return
    if (!tags.some((t) => t.toLowerCase() === tag.toLowerCase())) setTags([...tags, tag])
    setTagText('')
  }

  const submit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (valid) onSave(values)
  }

  return (
    <form onSubmit={submit} className="contents">
      <DialogHeader>
        <DialogTitle className="font-sans">{note ? 'Edit Note' : 'Add Note'}</DialogTitle>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        <FormField label="Title" htmlFor="note-title">
          <Input
            id="note-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title"
            className="border-transparent"
          />
        </FormField>
        <FormField label="Body" htmlFor="note-content" required>
          <textarea
            id="note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter body"
            className="h-30 w-full resize-none rounded-xl border border-transparent bg-surface px-4 py-2.5 leading-5.5 outline-none placeholder:text-subtle focus:border-primary"
          />
        </FormField>
        <FormField
          label="Tags"
          htmlFor="note-tags"
          hint={
            showHint && (
              <div className="flex flex-col gap-2">
                <p className="flex items-center gap-1 text-xs leading-5 text-muted-foreground">
                  <InfoDotIcon />
                  You can have up to {MAX_TAGS} tags
                </p>
                {tags.length > 0 && (
                  <ul aria-label="Tags" className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <li
                        key={tag}
                        className="inline-flex h-6 items-center gap-1 rounded-md border border-border bg-background pr-1 pl-1.5 text-xs text-foreground"
                      >
                        {tag}
                        <button
                          type="button"
                          aria-label={`Remove ${tag}`}
                          onClick={() => setTags(tags.filter((t) => t !== tag))}
                          className="flex rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
                        >
                          <XIcon className="size-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          }
        >
          <Input
            id="note-tags"
            value={tagText}
            disabled={full}
            maxLength={30}
            onChange={(e) => setTagText(e.target.value)}
            onFocus={() => setTagsFocused(true)}
            onBlur={() => setTagsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault() // a tag, not a submit
                addTag()
              } else if (e.key === 'Backspace' && !tagText && tags.length) setTags(tags.slice(0, -1))
            }}
            placeholder="Type tag and press enter to separate"
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
        <Button type="submit" size="xs" disabled={!valid} loading={saving} loadingText="Saving…">
          {note ? 'Save Changes' : 'Add Note'}
        </Button>
      </DialogFooter>
    </form>
  )
}
