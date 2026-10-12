import { CloseIcon, SearchIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

/** Table search box: magnifier, text, ✕ to clear once there's a value. Size with className (default w-60). */
export function SearchInput({
  value,
  onChange,
  label,
  placeholder = 'Search...',
  className,
}: {
  value: string
  onChange: (value: string) => void
  /** Accessible name, e.g. "Search assets" */
  label: string
  placeholder?: string
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
        aria-label={label}
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-subtle"
      />
      {value && (
        <button type="button" aria-label="Clear search" onClick={() => onChange('')} className="flex">
          <CloseIcon className="size-3" />
        </button>
      )}
    </label>
  )
}
