import { ChevronDownIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface FilterOption {
  label: string
  value: string | null
}

/** Pill filter. Shows the active choice and turns blue when a filter is set. */
export function FilterMenu({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string | null
  options: FilterOption[]
  onChange: (value: string | null) => void
}) {
  const active = value !== null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="xs"
          className={cn(
            'gap-1 font-medium',
            active && 'border border-primary-dark bg-primary-subtle bg-none text-primary-dark shadow-none',
          )}
        >
          {active ? (options.find((o) => o.value === value)?.label ?? label) : label}
          <ChevronDownIcon className={cn('size-2.5', active && 'text-primary-dark')} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-40 p-1">
        {options.map((o) => (
          <DropdownMenuItem
            key={String(o.value)}
            onSelect={() => onChange(o.value)}
            aria-checked={o.value === value}
            role="menuitemradio"
            className={cn('rounded-md px-2.5 py-1.5 text-13 font-normal', o.value === value && 'bg-accent')}
          >
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
