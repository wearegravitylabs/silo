import { CheckIcon, FolderIcon, Navigation2Icon, Trash2Icon } from 'lucide-react'
import { DotsIcon, EyeIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { FolderRef } from '../../types'

/**
 * ⋯ menu on an asset row: View details, Move Folders (a list of folders, the current one ticked), Add Auto-pilot Rule,
 * Delete Asset. Items without a handler are disabled. `onOpenChange` lets the row shade itself while open.
 */
export function AssetRowMenu({
  name,
  folders,
  folderId,
  onOpenChange,
  onView,
  onMove,
  onAddRule,
  onDelete,
}: {
  name: string
  folders: FolderRef[]
  /** The folder it's filed in (the default folder when unfiled) */
  folderId: string
  onOpenChange?: (open: boolean) => void
  onView?: () => void
  onMove?: (folderId: string) => void
  onAddRule?: () => void
  onDelete?: () => void
}) {
  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={`${name} options`}>
          <DotsIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={onView} disabled={!onView}>
          <EyeIcon className="size-4" />
          View details
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={!onMove || folders.length < 2}>
            <FolderIcon className="size-4" />
            Move Folders
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-52">
            {folders.map((f) => (
              <DropdownMenuItem key={f.id} onSelect={() => f.id !== folderId && onMove?.(f.id)}>
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                {f.id === folderId && <CheckIcon className="size-3.5" aria-label="Current folder" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onSelect={onAddRule} disabled={!onAddRule}>
          <Navigation2Icon className="size-4 -rotate-90" />
          Add Auto-pilot Rule
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete} disabled={!onDelete}>
          <Trash2Icon className="size-4" />
          Delete Asset
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
