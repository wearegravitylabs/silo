import { CircleXIcon } from 'lucide-react'
import { SearchIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

/** Table search box: magnifier, text, round ✕ to clear once there's a value. Size with className (default w-60). */
export function SearchInput({
  value,
  onChange,
  label,
  placeholder = 'Search...',
  autoFocus,
  className,
}: {
  value: string
  onChange: (value: string) => void
  /** Accessible name, e.g. "Search assets" */
  label: string
  placeholder?: string
  autoFocus?: boolean
  className?: string
}) {
  return (
    <label
      className={cn(
        'flex h-8 w-60 items-center gap-2 rounded-lg border border-border bg-surface px-3 focus-within:border-primary',
        className,
      )}
    >
      <SearchIcon className="size-3.5" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label={label}
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-subtle"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="flex rounded-full transition-opacity outline-none hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <CircleXIcon className="size-4 fill-muted-foreground text-surface" aria-hidden />
        </button>
      )}
    </label>
  )
}
