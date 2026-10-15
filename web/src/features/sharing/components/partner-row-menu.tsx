import { PencilIcon, Trash2Icon } from 'lucide-react'
import { DotsIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * ⋯ on a partner row: Manage / Revoke Access for someone who joined, Edit / Revoke Invite while invited.
 * `onOpenChange` lets the row shade itself while open.
 */
export function PartnerRowMenu({
  label,
  invited,
  onOpenChange,
  onEdit,
  onRevoke,
}: {
  /** Who the menu is for, e.g. "Taiwo Odetola" */
  label: string
  invited: boolean
  onOpenChange?: (open: boolean) => void
  onEdit: () => void
  onRevoke: () => void
}) {
  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={`${label} options`}>
          <DotsIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-50">
        <DropdownMenuItem onSelect={onEdit}>
          <PencilIcon className="size-4" />
          {invited ? 'Edit Invite' : 'Manage Access'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onRevoke}>
          <Trash2Icon className="size-4" />
          {invited ? 'Revoke Invite' : 'Revoke Access'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
