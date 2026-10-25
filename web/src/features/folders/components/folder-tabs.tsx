import { useRef, useState, type ReactNode } from 'react'
import { CirclePlusIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { FolderGlyph } from '@/components/folder-glyph'
import { AiSparkleIcon, DotsIcon } from '@/components/icons'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toastDone } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import { defaultFolderId, folderColor } from '@/lib/folders'
import { useFolderMutations } from '../queries'
import type { Folder, FolderType } from '../types'
import { DeleteFolderDialog } from './delete-folder-dialog'
import { FolderFormDialog } from './folder-form-dialog'

const NOUN: Record<FolderType, string> = { asset: 'Asset', debt: 'Debt' }

// One boxed cell of the tab bar: full height, divided from the next by a rule.
const cell = 'flex h-full shrink-0 items-center border-r border-border'

/**
 * Folder card: a grey tab bar (select, drag to reorder, ⋯ to edit or delete, + to create a folder or organize them)
 * over `children` — the selected folder's overview. Each tab shows its folder's colour. Create and Edit open the folder
 * dialog; Delete asks which folder takes its items. The default folder ("All Assets") comes first, stays put and has
 * no menu. The bar scrolls sideways when the tabs don't fit.
 */
export function FolderTabs({
  folders,
  selectedId,
  onSelect,
  portfolioId,
  folderType,
  onOrganize,
  counts,
  onDeleted,
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
  /** Items per folder, for Delete Folder's list (the default folder counts everything) */
  counts?: Record<string, number>
  /**
   * After a folder is deleted, with the folder its items went to. TODO: the backend refiles them itself; this lets the
   * page refile them in its mock.
   */
  onDeleted?: (id: string, moveTo: string) => void
  className?: string
  /** Shown under the tab bar (e.g. the folder's stats) */
  children?: ReactNode
}) {
  const { create, update, remove, reorder } = useFolderMutations(portfolioId, folderType)
  // The form dialog: create (null folder) or edit; kept while it closes.
  const [form, setForm] = useState<{ folder: Folder | null; open: boolean } | null>(null)
  const [deleting, setDeleting] = useState<{ folder: Folder; open: boolean } | null>(null)
  const defaultId = defaultFolderId(folderType)
  const noun = NOUN[folderType]
  const colorOf = (folder: Folder) => folderColor(folder, folders.indexOf(folder))

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

  const closeForm = () => setForm((f) => f && { ...f, open: false })
  const save = (values: { name: string; color: string }) => {
    const editing = form?.folder
    if (editing)
      update.mutate(
        { id: editing.id, ...values },
        {
          onSuccess: () => {
            closeForm()
            toast.success('Folder has been updated successfully!')
          },
          onError: () => toast.error('Couldn’t update this folder. Try again.'),
        },
      )
    else
      create.mutate(values, {
        onSuccess: (folder) => {
          closeForm()
          onSelect(folder.id)
          toast.success('Folder has been created successfully!')
        },
        onError: () => toast.error('Couldn’t create the folder. Try again.'),
      })
  }

  const confirmDelete = (moveTo: string) => {
    if (!deleting) return
    const { id } = deleting.folder
    remove.mutate(
      { id, moveTo },
      {
        onSuccess: () => {
          onDeleted?.(id, moveTo)
          setDeleting((d) => d && { ...d, open: false })
          toastDone('Folder has been deleted successfully!')
          if (id === selectedId) onSelect(moveTo)
        },
        onError: () => toast.error('Couldn’t delete this folder. Try again.'),
      },
    )
  }

  return (
    <section className={cn('mx-4 flex shrink-0 flex-col overflow-hidden rounded-2xl border md:mx-10', className)}>
      <div className={cn('flex h-11.5 shrink-0 overflow-x-auto bg-surface', children && 'border-b border-border')}>
        <div role="tablist" aria-label="Folders" className="flex h-full">
          {ordered.map((folder) => {
            const active = folder.id === selectedId
            const isDefault = folder.id === defaultId
            const color = colorOf(folder)

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
                  <FolderGlyph style={{ color }} />
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
                      <DropdownMenuItem onSelect={() => setForm({ folder, open: true })}>
                        <PencilIcon className="size-4" />
                        Edit Folder
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setDeleting({ folder, open: true })}>
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
            <DropdownMenuItem onSelect={() => setForm({ folder: null, open: true })}>
              <CirclePlusIcon className="size-4" />
              Create Folder
            </DropdownMenuItem>
            {onOrganize && (
              <DropdownMenuItem onSelect={onOrganize}>
                <AiSparkleIcon />
                Organize {noun.toLowerCase()}s into Folders
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {children}

      <FolderFormDialog
        folder={form?.folder && { name: form.folder.name, color: colorOf(form.folder) }}
        open={!!form?.open}
        onOpenChange={(open) => setForm((f) => f && { ...f, open })}
        onSave={save}
        saving={create.isPending || update.isPending}
      />
      <DeleteFolderDialog
        folder={deleting?.folder ?? null}
        folders={folders.filter((f) => f.id !== deleting?.folder.id).map((f) => ({ ...f, color: colorOf(f) }))}
        defaultId={defaultId}
        counts={counts}
        noun={noun}
        open={!!deleting?.open}
        onOpenChange={(open) => setDeleting((d) => d && { ...d, open })}
        pending={remove.isPending}
        onConfirm={confirmDelete}
      />
    </section>
  )
}
