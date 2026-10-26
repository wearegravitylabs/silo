import { useState, type ReactNode } from 'react'
import { PipetteIcon } from 'lucide-react'
import { ColorSwatches } from '@/components/color-swatches'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/**
 * A round mark (children) with a pipette badge at its foot that opens colour swatches centred under the whole disc
 * (domain colour, folder colour). Size and style the disc with className.
 */
export function ColorPickerDisc({
  colors,
  value,
  onChange,
  label,
  className,
  badgeClassName = '-right-1 -bottom-1',
  children,
}: {
  colors: readonly string[]
  value: string
  onChange: (color: string) => void
  /** Names the swatches and the badge ("Folder colour") */
  label: string
  className?: string
  /** Where the badge sits on the disc's edge */
  badgeClassName?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className={cn('relative shrink-0', className)}>
          {children}
          <PopoverTrigger
            aria-label={`Choose ${label.toLowerCase()}`}
            className={cn(
              'absolute flex size-6 items-center justify-center rounded-full bg-background text-muted-foreground shadow-small transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40',
              badgeClassName,
            )}
          >
            <PipetteIcon className="size-3" />
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent align="center" sideOffset={6} className="w-auto px-3 py-2.5">
        <ColorSwatches colors={colors} value={value} onChange={onChange} label={label} swatchClassName="size-7" />
      </PopoverContent>
    </Popover>
  )
}
