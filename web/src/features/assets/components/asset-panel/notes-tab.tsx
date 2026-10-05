import { useState } from 'react'
import { PlusCircleIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { useAssetNotes, useNoteMutations } from '../../queries'
import type { AssetItem, AssetNote } from '../../types'
import { NoteDialog } from './note-dialog'
import { PencilIcon, TrashIcon } from './panel-icons'
import { TabBody, TabCta, TabEmpty, TabListSkeleton } from './tab-layout'

/** Note tab: list, add, edit and delete notes on this asset. */
export function NotesTab({ asset, portfolioId }: { asset: AssetItem; portfolioId: string }) {
  const [compose, setCompose] = useState<{ open: boolean; note: AssetNote | null }>({ open: false, note: null })
  const { data: notes, isPending } = useAssetNotes(portfolioId, asset.id)
  const { remove } = useNoteMutations(portfolioId, asset.id)

  return (
    <>
      <TabBody>
        {isPending ? (
          <TabListSkeleton rows={2} className="h-28" />
        ) : !notes?.length ? (
          <TabEmpty title="No notes added" body="Add notes to keep track of information about this asset." />
        ) : (
          <ul className="flex flex-col gap-3">
            {notes.map((note) => (
              <li key={note.id} className="rounded-xl bg-surface">
                <div className="flex h-6.5 items-center justify-between px-3 py-1">
                  <span className="text-2xs font-medium tracking-caps text-muted-foreground uppercase">{note.title || 'Note'}</span>
                  <div className="flex items-center gap-3 text-subtle">
                    <button
                      type="button"
                      aria-label="Edit note"
                      onClick={() => setCompose({ open: true, note })}
                      className="flex hover:text-muted-foreground"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete note"
                      onClick={() => remove.mutate(note.id)}
                      className="flex hover:text-destructive"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 rounded-xl border bg-background p-3">
                  <span className="text-sm leading-5.5 font-medium tracking-label">{note.title || 'Untitled'}</span>
                  <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{note.content}</p>
                  {!!note.tags?.items?.length && (
                    <div className="mt-0.5 flex flex-wrap gap-1.5">
                      {note.tags.items.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex h-5 items-center rounded-md border-[0.5px] border-line bg-accent px-1 text-xs font-medium tracking-label"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </TabBody>
      <TabCta>
        <Button onClick={() => setCompose({ open: true, note: null })} className="rounded-10">
          <PlusCircleIcon className="text-white" />
          Add Note
        </Button>
      </TabCta>
      <NoteDialog
        portfolioId={portfolioId}
        assetId={asset.id}
        note={compose.note}
        open={compose.open}
        onOpenChange={(open) => setCompose((c) => ({ ...c, open }))}
      />
    </>
  )
}
