import { useState } from 'react'
import { GlobeIcon, PipetteIcon } from 'lucide-react'
import { ColorSwatches } from '@/components/color-swatches'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DOMAIN_COLORS } from '../../constants'

/** 64px globe disc tinted with the domain's colour; the pipette badge opens the swatches under it. */
export function DomainColorDisc({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* The swatches open centred under the disc, not under the small badge. */}
      <PopoverAnchor asChild>
        <div className="relative size-16 shrink-0">
          <span
            style={{ color: value }}
            className="flex size-full items-center justify-center rounded-full border border-current/20 bg-current/12 transition-colors"
          >
            <GlobeIcon className="size-5" aria-hidden />
          </span>
          <PopoverTrigger
            aria-label="Choose domain colour"
            className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full bg-background text-muted-foreground shadow-small transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <PipetteIcon className="size-3" />
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent align="center" sideOffset={6} className="w-auto px-3 py-2.5">
        <ColorSwatches colors={DOMAIN_COLORS} value={value} onChange={onChange} label="Domain colour" swatchClassName="size-7" />
      </PopoverContent>
    </Popover>
  )
}
