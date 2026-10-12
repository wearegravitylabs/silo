import { useState, type ComponentType, type SVGProps } from 'react'
import { PencilIcon } from 'lucide-react'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface IconOption {
  id: string
  label: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

/**
 * 64px icon disc with a pencil badge; the badge opens a grid of icons to choose from.
 * `discClassName` fills the disc, `iconClassName` colours the icons (disc and grid), `selectedClassName` tints the chosen cell —
 * e.g. debts pass a pink disc, red icons and a pink tint.
 */
export function IconPicker({
  value,
  onChange,
  options,
  columns = 7,
  label = 'Choose icon',
  discClassName = 'border-line bg-accent',
  iconClassName = 'text-primary-dark',
  selectedClassName = 'bg-accent',
  className,
}: {
  value: string
  onChange: (id: string) => void
  options: IconOption[]
  columns?: number
  label?: string
  discClassName?: string
  iconClassName?: string
  selectedClassName?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.id === value) ?? options[0]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* The grid opens centred under the disc, not under the small badge. */}
      <PopoverAnchor asChild>
        <div className={cn('relative size-16 shrink-0', className)}>
          <span className={cn('flex size-full items-center justify-center rounded-full border', discClassName)}>
            {current && <current.Icon className={cn('size-5', iconClassName)} aria-hidden />}
          </span>
          <PopoverTrigger
            aria-label={label}
            className="absolute -right-0.5 -bottom-0.5 flex size-6 items-center justify-center rounded-full bg-background text-muted-foreground shadow-small transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <PencilIcon className="size-3 fill-current" aria-hidden />
          </PopoverTrigger>
        </div>
      </PopoverAnchor>

      <PopoverContent align="center" sideOffset={4} collisionPadding={16} className="rounded-xl border border-border p-1.5">
        <div
          role="radiogroup"
          aria-label={label}
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {options.map(({ id, label: name, Icon }) => {
            const selected = id === current?.id
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={name}
                title={name}
                onClick={() => {
                  onChange(id)
                  setOpen(false)
                }}
                className={cn(
                  'flex size-8 items-center justify-center rounded-lg transition-colors outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring/40',
                  selected && selectedClassName,
                )}
              >
                <Icon className={cn('size-4', iconClassName)} aria-hidden />
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
