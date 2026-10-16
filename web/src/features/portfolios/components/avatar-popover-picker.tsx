import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { AVATAR_IDS, AvatarFace, type AvatarId } from './avatar-picker'

/**
 * 80px portfolio face that opens the four choices beside it. A pick applies straight away and the row stays open
 * to compare; click away or Esc closes it. `disabled` shows the face only.
 */
export function AvatarPopoverPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: AvatarId
  onChange: (id: AvatarId) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)

  if (disabled) return <AvatarFace id={value} className="size-20" />

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="Change portfolio avatar"
        className="w-fit rounded-full transition-opacity outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <AvatarFace id={value} className="size-20" />
      </PopoverTrigger>
      <PopoverContent side="right" align="center" sideOffset={16} className="p-2">
        <div className="flex gap-1.5" role="radiogroup" aria-label="Portfolio avatar">
          {AVATAR_IDS.map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={id === value}
              aria-label={`${id} avatar`}
              onClick={() => onChange(id)}
              className={cn(
                'size-8 rounded-full border p-px transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none',
                id === value ? 'border-primary-dark' : 'border-transparent hover:border-line',
              )}
            >
              <AvatarFace id={id} className="size-full" />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
