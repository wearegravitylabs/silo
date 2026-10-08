import { ChevronDownIcon, Svg, type IconProps } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

/** Dashboard shortcuts. Only "Add asset" works today; the rest are shown as coming soon. */
export function QuickActionsMenu({ onAddAsset }: { onAddAsset: () => void }) {
  const soon = ['Add debt', 'Add portfolio', 'Invite member']

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="xs" className="gap-1 shadow-elevated">
          Quick Actions
          <ChevronDownIcon className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-65">
        <DropdownMenuItem onSelect={onAddAsset} className="bg-accent">
          <AddIcon />
          Add asset
        </DropdownMenuItem>
        {soon.map((label) => (
          <DropdownMenuItem key={label} disabled>
            <AddIcon />
            {label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem disabled>
          <ImportIcon />
          Import data
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AddIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className="size-4" {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 1.5a6.5 6.5 0 1 0 0 13A6.5 6.5 0 0 0 8 1.5ZM7.25 5a.75.75 0 0 1 1.5 0v2.25H11a.75.75 0 0 1 0 1.5H8.75V11a.75.75 0 0 1-1.5 0V8.75H5a.75.75 0 0 1 0-1.5h2.25V5Z"
      />
    </Svg>
  )
}

function ImportIcon(props: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" className="size-4" {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 1.5a.75.75 0 0 1 .75.75V9.94l1.97-1.97a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 9.03a.75.75 0 0 1 1.06-1.06L7.25 9.94V2.25A.75.75 0 0 1 8 1.5ZM2.5 13.25a.75.75 0 0 1 .75-.75h9.5a.75.75 0 0 1 0 1.5h-9.5a.75.75 0 0 1-.75-.75Z"
      />
    </Svg>
  )
}
