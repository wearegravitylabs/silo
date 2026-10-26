import { CirclePlusIcon } from 'lucide-react'
import { ChoiceCard } from '@/components/choice-card'
import { FolderGlyph } from '@/components/folder-glyph'
import { folderColor } from '@/lib/folders'
import { cn } from '@/lib/utils'

export interface FolderChoice {
  id: string
  name: string
  color?: string | null
}

/**
 * Pick one folder (Move Folders, Delete Folder's "move to"): a card per folder with its glossy icon and item count
 * ("4 Assets"), the chosen one ticked. `onAdd` puts an "Add Folder" card first. The dialog body scrolls a long list.
 */
export function FolderChoiceList({
  folders,
  value,
  onChange,
  counts,
  noun,
  onAdd,
  label,
  className,
}: {
  folders: FolderChoice[]
  value: string | null
  onChange: (id: string) => void
  /** Items per folder id */
  counts?: Record<string, number>
  /** Singular item name for the counts ("Asset") */
  noun: string
  onAdd?: () => void
  label: string
  className?: string
}) {
  const count = (id: string) => {
    const n = counts?.[id] ?? 0
    return `${n} ${noun}${n === 1 ? '' : 's'}`
  }
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="flex min-h-18 w-full shrink-0 items-center gap-3 rounded-xl bg-surface p-3 text-left transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-muted-foreground">
            <CirclePlusIcon className="size-4" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate font-medium text-foreground">Add Folder</span>
            <span className="truncate text-xs leading-4 text-muted-foreground">Create a new folder</span>
          </span>
        </button>
      )}
      <div role="radiogroup" aria-label={label} className="flex flex-col gap-4">
        {folders.map((folder, i) => (
          <ChoiceCard
            key={folder.id}
            label={folder.name}
            description={count(folder.id)}
            icon={<FolderGlyph className="h-8 w-10" style={{ color: folderColor(folder, i) }} />}
            selected={folder.id === value}
            onSelect={() => onChange(folder.id)}
            className="min-h-18"
          />
        ))}
      </div>
    </div>
  )
}
