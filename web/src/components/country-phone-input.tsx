import { useState } from 'react'
import { ChevronDownIcon } from '@/components/icons'
import { SearchList } from '@/components/search-list'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ALL_COUNTRIES, type Country } from '@/lib/countries'
import { cn } from '@/lib/utils'

/** Phone field with a searchable country/dial-code picker on the left. */
export function CountryPhoneInput({
  value,
  onChange,
  country,
  onCountryChange,
  invalid,
  placeholder = '801 234 5678',
  id,
}: {
  /** National number, without the dial code */
  value: string
  onChange: (value: string) => void
  country: Country
  onCountryChange: (country: Country) => void
  invalid?: boolean
  placeholder?: string
  id?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div
          className={cn(
            'flex h-10 items-center overflow-hidden rounded-xl bg-surface transition-colors',
            invalid ? 'border-2 border-destructive' : 'border border-border focus-within:border-primary',
          )}
        >
          <PopoverTrigger
            aria-label="Select country code"
            className="flex h-full w-24 shrink-0 items-center gap-1 px-3 transition-colors hover:bg-ink/3"
          >
            <span className="text-sm leading-none">{country.flag}</span>
            <span className="text-sm font-medium">{country.dialCode}</span>
            <ChevronDownIcon className={cn('transition-transform duration-200', open && 'rotate-180')} />
          </PopoverTrigger>

          <div className="h-5 w-px shrink-0 bg-border" />

          <input
            id={id}
            type="tel"
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/[^\d\s\-()]/g, ''))}
            placeholder={placeholder}
            aria-invalid={invalid || undefined}
            className="h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-subtle"
          />
        </div>
      </PopoverAnchor>

      <PopoverContent className="w-70">
        <SearchList
          items={ALL_COUNTRIES}
          getKey={(c) => c.code}
          matches={(c, q) => c.name.toLowerCase().includes(q) || c.dialCode.includes(q) || c.code.toLowerCase().startsWith(q)}
          selectedKey={country.code}
          placeholder="Search country…"
          onSelect={(c) => {
            onCountryChange(c)
            setOpen(false)
          }}
          renderItem={(c) => (
            <>
              <span className="w-4.5 text-sm leading-none">{c.flag}</span>
              <span className="flex-1 truncate">{c.name}</span>
              <span className="shrink-0 text-muted-foreground">{c.dialCode}</span>
            </>
          )}
        />
      </PopoverContent>
    </Popover>
  )
}
