import { Navigation2Icon, Trash2Icon } from 'lucide-react'
import { DotsIcon, EyeIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/** ⋯ menu on a debt row: View details, Add Auto-pilot, Delete Debt. `onOpenChange` lets the row shade itself while open. */
export function DebtRowMenu({
  name,
  onOpenChange,
  onView,
  onAddRule,
  onDelete,
}: {
  name: string
  onOpenChange?: (open: boolean) => void
  onView?: () => void
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
        <DropdownMenuItem onSelect={onView}>
          <EyeIcon className="size-4" />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onAddRule}>
          <Navigation2Icon className="size-4 -rotate-90" />
          Add Auto-pilot
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2Icon className="size-4" />
          Delete Debt
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
