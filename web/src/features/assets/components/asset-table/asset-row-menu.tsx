import { FolderIcon, Navigation2Icon, Trash2Icon } from 'lucide-react'
import { DotsIcon, EyeIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * ⋯ menu on an asset row: View details, Move Folders (the page opens its folder picker), Add Auto-pilot Rule,
 * Delete Asset. Items without a handler are disabled. `onOpenChange` lets the row shade itself while open.
 */
export function AssetRowMenu({
  name,
  onOpenChange,
  onView,
  onMove,
  onAddRule,
  onDelete,
}: {
  name: string
  onOpenChange?: (open: boolean) => void
  onView?: () => void
  onMove?: () => void
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
        <DropdownMenuItem onSelect={onMove} disabled={!onMove}>
          <FolderIcon className="size-4" />
          Move Folders
        </DropdownMenuItem>
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
