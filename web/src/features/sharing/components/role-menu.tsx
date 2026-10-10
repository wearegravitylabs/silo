import { ChevronDownIcon, EyeIcon, UsersIcon } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ROLE_LABEL } from '../mock-data'
import type { AccessRole } from '../types'

const ROLE_ICON = { viewer: EyeIcon, partner: UsersIcon }

/** "Viewer ⌄" inside the invite field: pick the role the invitees get. */
export function RoleMenu({
  value,
  onChange,
  defaultOpen,
}: {
  value: AccessRole
  onChange: (role: AccessRole) => void
  defaultOpen?: boolean
}) {
  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger className="flex shrink-0 items-center gap-1 rounded-md text-xs font-semibold text-primary-dark outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
        {ROLE_LABEL[value]}
        <ChevronDownIcon className="size-3 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-28">
        {(Object.keys(ROLE_LABEL) as AccessRole[]).map((role) => {
          const Icon = ROLE_ICON[role]
          return (
            <DropdownMenuItem key={role} onSelect={() => onChange(role)} className={cn(role === value && 'bg-accent')}>
              <Icon className="size-4" aria-hidden />
              {ROLE_LABEL[role]}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
