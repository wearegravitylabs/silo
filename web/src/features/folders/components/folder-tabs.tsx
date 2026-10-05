import { useRef, useState } from 'react'
import { CloseIcon, DotsIcon, EyeIcon, EyeOffIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useFolderMutations } from '../queries'
import type { Folder } from '../types'

const TAB_COLORS = ['bg-folder-1', 'bg-folder-2', 'bg-folder-3', 'bg-folder-4', 'bg-folder-5', 'bg-folder-6']

/**
 * Folder tab strip: select, drag to reorder, rename inline, delete, create.
 * The stats toggle sits at the far right.
 */
export function FolderTabs({
  folders,
  selectedId,
  onSelect,
  portfolioId,
  showCards,
  onToggleCards,
}: {
  folders: Folder[]
  selectedId: string | null
  onSelect: (id: string) => void
  portfolioId: string
  showCards: boolean
  onToggleCards: () => void
}) {
  const { create, rename, remove, reorder } = useFolderMutations(portfolioId, 'asset')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Drag & drop: a local order while dragging, committed (optimistically) on drop.
  const [dragOrder, setDragOrder] = useState<Folder[] | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const lastOver = useRef<string | null>(null)
  const ordered = dragOrder ?? folders

  const endDrag = () => {
    setDraggedId(null)
    setDragOrder(null)
    lastOver.current = null
  }

  const dragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault()
    if (overId === draggedId || overId === lastOver.current) return
    lastOver.current = overId
    setDragOrder((prev) => {
      if (!prev) return prev
      const next = [...prev]
      const from = next.findIndex((f) => f.id === draggedId)
      const to = next.findIndex((f) => f.id === overId)
      if (from < 0 || to < 0) return prev
      next.splice(to, 0, next.splice(from, 1)[0])
      return next
    })
  }

  const deleteFolder = (id: string) =>
    remove.mutate(id, {
      onSuccess: () => {
        const next = ordered.find((f) => f.id !== id)
        if (id === selectedId && next) onSelect(next.id)
      },
    })

  return (
    <div className="relative flex shrink-0 items-end overflow-x-auto border-b px-10">
      <div role="tablist" aria-label="Folders" className="flex items-end">
        {ordered.map((folder, i) => {
          const color = TAB_COLORS[i % TAB_COLORS.length]
          const active = folder.id === selectedId

          if (editingId === folder.id) {
            return (
              <div key={folder.id} className="-mb-px flex items-center gap-1.5 border-b-2 border-primary-dark px-3 py-2">
                <FolderBadge className={color} />
                <RenameInput
                  initial={folder.name}
                  onCommit={(name) =>
                    name && name !== folder.name
                      ? rename.mutate({ id: folder.id, name }, { onSettled: () => setEditingId(null) })
                      : setEditingId(null)
                  }
                  onCancel={() => setEditingId(null)}
                />
              </div>
            )
          }

          return (
            <div
              key={folder.id}
              draggable
              onDragStart={() => {
                setDraggedId(folder.id)
                setDragOrder(folders)
              }}
              onDragOver={(e) => dragOver(e, folder.id)}
              onDrop={() => {
                if (draggedId) reorder.mutate(ordered)
                endDrag()
              }}
              onDragEnd={endDrag}
              className={cn(
                '-mb-px flex cursor-grab items-center border-b-2 transition-opacity',
                active ? 'border-primary-dark' : 'border-transparent',
                folder.id === draggedId && 'opacity-35',
              )}
            >
              <button
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelect(folder.id)}
                className={cn(
                  'flex items-center gap-2 py-2.5 pr-1.5 pl-3.5 text-13 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none',
                  active ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground',
                )}
              >
                <FolderBadge className={color} />
                {folder.name}
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={`${folder.name} options`}
                  className="mr-2.5 flex size-4.5 items-center justify-center rounded-sm text-subtle outline-none hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40 aria-expanded:text-muted-foreground"
                >
                  <DotsIcon className="text-current" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-35">
                  <DropdownMenuItem onSelect={() => setEditingId(folder.id)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onSelect={() => deleteFolder(folder.id)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        })}
      </div>

      {creating ? (
        <NewFolderForm
          pending={create.isPending}
          onCancel={() => setCreating(false)}
          onCreate={(name) =>
            create.mutate(name, {
              onSuccess: (folder) => {
                setCreating(false)
                onSelect(folder.id)
              },
            })
          }
        />
      ) : (
        <button
          type="button"
          aria-label="New folder"
          onClick={() => setCreating(true)}
          className="mb-1 ml-1 flex size-8 items-center justify-center rounded-lg text-subtle transition-opacity hover:opacity-70"
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-4">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      )}

      <button
        type="button"
        onClick={onToggleCards}
        aria-pressed={!showCards}
        title={showCards ? 'Hide stats' : 'Show stats'}
        className="mb-1.5 ml-auto flex shrink-0 items-center gap-1 rounded-md px-1 py-0.5 text-xs font-medium text-subtle transition-colors hover:text-muted-foreground"
      >
        {showCards ? <EyeOffIcon /> : <EyeIcon />}
        {showCards ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}

function FolderBadge({ className }: { className: string }) {
  return (
    <span className={cn('flex size-4.5 shrink-0 items-center justify-center rounded-[5px]', className)}>
      <svg viewBox="0 0 11 10" fill="none" aria-hidden="true" className="h-2.5 w-2.75">
        <path d="M.5 2a1 1 0 0 1 1-1H4l1 1h4.5a1 1 0 0 1 1 1V8a1 1 0 0 1-1 1H1.5A1 1 0 0 1 .5 8V2Z" className="fill-white/90" />
      </svg>
    </span>
  )
}

/** Inline rename: Enter or blur commits the trimmed value, Escape cancels. */
function RenameInput({ initial, onCommit, onCancel }: { initial: string; onCommit: (name: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(initial)
  const done = useRef(false) // Enter then blur must commit only once
  const finish = (commit: boolean) => {
    if (done.current) return
    done.current = true
    if (commit) onCommit(value.trim())
    else onCancel()
  }
  return (
    <input
      autoFocus
      value={value}
      aria-label="Folder name"
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') finish(true)
        if (e.key === 'Escape') finish(false)
      }}
      onBlur={() => finish(true)}
      className="h-6 w-27.5 rounded-[5px] border border-primary-dark bg-background px-2 text-13 outline-none"
    />
  )
}

function NewFolderForm({ pending, onCreate, onCancel }: { pending: boolean; onCreate: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  return (
    <form
      className="mb-1 flex items-center gap-2 px-2 py-1.5"
      onSubmit={(e) => {
        e.preventDefault()
        if (name.trim()) onCreate(name.trim())
        else onCancel()
      }}
    >
      <input
        autoFocus
        value={name}
        disabled={pending}
        placeholder="Folder name"
        aria-label="New folder name"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
        className="h-7 w-35 rounded-md border border-primary-dark bg-background px-2.5 text-13 outline-none"
      />
      <Button size="xs" type="submit" disabled={pending}>
        {pending ? '…' : 'Create'}
      </Button>
      <button type="button" aria-label="Cancel" onClick={onCancel} className="flex p-1">
        <CloseIcon className="size-3.5" />
      </button>
    </form>
  )
}
