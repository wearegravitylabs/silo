import { ChevronDownIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface MultiFilterOption {
  value: string
  label: string
}

/**
 * Pill filter with checkboxes; tick any number of options and the menu stays open.
 * The pill reads the label when nothing is ticked, the option when one is, and "First +N" for several.
 * `values` always come back in option order.
 */
export function MultiFilterMenu({
  label,
  options,
  values,
  onChange,
  allLabel,
  className,
  contentClassName,
}: {
  label: string
  options: MultiFilterOption[]
  values: string[]
  onChange: (values: string[]) => void
  /** Shown when every option is ticked, e.g. "All Scenarios" */
  allLabel?: string
  className?: string
  contentClassName?: string
}) {
  const picked = options.filter((o) => values.includes(o.value))
  const text =
    allLabel && picked.length === options.length
      ? allLabel
      : picked.length === 0
        ? label
        : picked.length === 1
          ? picked[0].label
          : `${picked[0].label} +${picked.length - 1}`

  const toggle = (value: string, on: boolean) =>
    onChange(options.map((o) => o.value).filter((v) => (v === value ? on : values.includes(v))))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="xs"
          aria-label={picked.length ? `${label}: ${picked.map((o) => o.label).join(', ')}` : label}
          className={cn('group gap-1 font-medium aria-expanded:bg-accent aria-expanded:bg-none aria-expanded:shadow-none', className)}
        >
          {text}
          <ChevronDownIcon className="size-2.5 text-muted-foreground transition-transform duration-200 group-aria-expanded:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={cn('w-54', contentClassName)}>
        {options.map((o) => (
          <DropdownMenuCheckboxItem key={o.value} checked={values.includes(o.value)} onCheckedChange={(on) => toggle(o.value, on)}>
            {o.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
