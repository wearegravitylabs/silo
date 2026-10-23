import { useRef, useState, type ReactNode } from 'react'
import { CirclePlusIcon, FolderIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { AiSparkleIcon, CloseIcon, DotsIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toastDone } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import { defaultFolderId } from '@/lib/folders'
import { useFolderMutations } from '../queries'
import type { Folder, FolderType } from '../types'

const FOLDER_COLORS = ['text-folder-1', 'text-folder-2', 'text-folder-3', 'text-folder-4', 'text-folder-5', 'text-folder-6']
const NOUN: Record<FolderType, string> = { asset: 'assets', debt: 'debts' }

// One boxed cell of the tab bar: full height, divided from the next by a rule.
const cell = 'flex h-full shrink-0 items-center border-r border-border'

/**
 * Folder card: a grey tab bar (select, drag to reorder, ⋯ to rename or delete, + to create a folder or organize them) over `children` — the selected folder's overview. The default folder ("All Assets") comes first,
 * stays put and has no menu. The bar scrolls sideways when the tabs don't fit.
 */
export function FolderTabs({
  folders,
  selectedId,
  onSelect,
  portfolioId,
  folderType,
  onOrganize,
  className,
  children,
}: {
  folders: Folder[]
  selectedId: string | null
  onSelect: (id: string) => void
  portfolioId: string
  folderType: FolderType
  /** Shows "Organize … into Folders" in the + menu (e.g. asks Silo AI) */
  onOrganize?: () => void
  className?: string
  /** Shown under the tab bar (e.g. the folder's stats) */
  children?: ReactNode
}) {
  const { create, rename, remove, reorder } = useFolderMutations(portfolioId, folderType)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Folder | null>(null)
  const defaultId = defaultFolderId(folderType)
  const defaultName = folders.find((f) => f.id === defaultId)?.name ?? 'the default folder'
  const noun = NOUN[folderType]

  // Drag & drop: a local order while dragging, committed (optimistically) on drop. The default folder stays first.
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
    if (overId === draggedId || overId === defaultId || overId === lastOver.current) return
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

  const confirmDelete = () => {
    if (!deleting) return
    const { id } = deleting
    remove.mutate(id, {
      onSuccess: () => {
        setDeleting(null)
        toastDone('Folder has been deleted successfully')
        if (id === selectedId) onSelect(defaultId)
      },
    })
  }

  return (
    <section className={cn('mx-4 flex shrink-0 flex-col overflow-hidden rounded-2xl border md:mx-10', className)}>
      <div className={cn('flex h-11.5 shrink-0 overflow-x-auto bg-surface', children && 'border-b border-border')}>
        <div role="tablist" aria-label="Folders" className="flex h-full">
          {ordered.map((folder, i) => {
            const color = FOLDER_COLORS[i % FOLDER_COLORS.length]
            const active = folder.id === selectedId
            const isDefault = folder.id === defaultId

            if (editingId === folder.id) {
              return (
                <div key={folder.id} className={cn(cell, 'gap-2 bg-background px-4')}>
                  <FolderIcon className={cn('size-4.5 shrink-0 fill-current', color)} aria-hidden />
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
                draggable={!isDefault}
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
                  cell,
                  'relative gap-2.5 pr-4 transition-[opacity,background-color]',
                  !isDefault && 'cursor-grab',
                  active ? 'bg-background' : 'hover:bg-accent/50',
                  folder.id === draggedId && 'opacity-35',
                )}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelect(folder.id)}
                  className="flex h-full items-center gap-2 pl-4 font-medium whitespace-nowrap text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset"
                >
                  <FolderIcon className={cn('size-4.5 shrink-0 fill-current', color)} aria-hidden />
                  {folder.name}
                </button>

                {!isDefault && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label={`${folder.name} options`}
                      className="flex size-5 items-center justify-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 aria-expanded:text-foreground"
                    >
                      <DotsIcon className="text-current" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-35">
                      <DropdownMenuItem onSelect={() => setEditingId(folder.id)}>
                        <PencilIcon className="size-4" />
                        Edit Folder
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setDeleting(folder)}>
                        <Trash2Icon className="size-4" />
                        Delete Folder
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {active && <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-dark" />}
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
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Add folder"
              className={cn(
                cell,
                'w-11.5 justify-center text-muted-foreground outline-none hover:bg-accent/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset aria-expanded:bg-accent/50',
              )}
            >
              <CirclePlusIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-65">
              <DropdownMenuItem onSelect={() => setCreating(true)}>
                <CirclePlusIcon className="size-4" />
                Create Folder
              </DropdownMenuItem>
              {onOrganize && (
                <DropdownMenuItem onSelect={onOrganize}>
                  <AiSparkleIcon />
                  Organize {noun} into Folders
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {children}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete Folder"
        confirmLabel="Delete Folder"
        cancelLabel="Close"
        size="sm"
        position="high"
        descriptionClassName="text-sm leading-5.5"
        pending={remove.isPending}
        onConfirm={confirmDelete}
      >
        You’re about to delete “{deleting?.name}”. Its {noun} won’t be deleted — they stay in {defaultName}.
      </ConfirmDialog>
    </section>
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
      className="h-7 w-35 rounded-md border border-primary-dark bg-background px-2.5 outline-none"
    />
  )
}

function NewFolderForm({ pending, onCreate, onCancel }: { pending: boolean; onCreate: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  return (
    <form
      className={cn(cell, 'gap-2 px-3')}
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
        className="h-7 w-35 rounded-md border border-primary-dark bg-background px-2.5 outline-none"
      />
      <Button size="xs" type="submit" loading={pending} loadingText="Creating…">
        Create
      </Button>
      <button type="button" aria-label="Cancel" onClick={onCancel} className="flex rounded-sm p-1 hover:opacity-70">
        <CloseIcon className="size-3.5" />
      </button>
    </form>
  )
}
