import { useId, useState } from 'react'
import { GoogleGIcon } from '@/components/icons'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { useAddressSearch } from '../../queries'

/**
 * Address typed against Google Places: suggestions drop down from 3 characters; picking one (click, or ↑ ↓ Enter) sets
 * the value. Typing again clears the value until another suggestion is picked, so only real addresses get through.
 */
export function AddressField({
  id,
  value,
  onChange,
  placeholder,
}: {
  id?: string
  /** The picked address; '' until one is */
  value: string
  onChange: (address: string) => void
  placeholder?: string
}) {
  const [text, setText] = useState(value)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const listId = useId()
  const query = useDebounce(text, 200)
  const { data: suggestions = [] } = useAddressSearch(value ? '' : query)
  const shown = open && !value && suggestions.length > 0

  const pick = (address: string) => {
    setText(address)
    onChange(address)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!shown) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (i + step + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(suggestions[Math.min(active, suggestions.length - 1)].description)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <Popover open={shown} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <InputGroup className={cn(shown && 'border-primary')}>
          <InputGroupInput
            id={id}
            role="combobox"
            aria-expanded={shown}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={shown ? `${listId}-${active}` : undefined}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setActive(0)
              setOpen(true)
              if (value) onChange('')
            }}
            onKeyDown={onKeyDown}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            autoComplete="off"
          />
          <GoogleGIcon className="mr-3" aria-label="Google Places" />
        </InputGroup>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
        // Clicking the field itself shouldn't count as "outside"
        onInteractOutside={(e) => e.target instanceof Node && document.getElementById(id ?? '')?.contains(e.target) && e.preventDefault()}
        className="w-(--radix-popover-trigger-width)"
      >
        <ul id={listId} role="listbox" aria-label="Address suggestions" className="flex flex-col gap-0.5">
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()} // keep focus in the field
              onClick={() => pick(s.description)}
              className={cn('cursor-pointer truncate rounded-lg px-3 py-1.5 leading-5.5 text-foreground', i === active && 'bg-accent')}
            >
              {s.description}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
