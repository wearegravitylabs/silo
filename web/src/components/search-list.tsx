import { useState, type ReactNode } from 'react'
import { SearchIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

/**
 * Search box + filterable option list, for use inside a PopoverContent
 * (country, currency pickers). The selected option scrolls into view on open.
 */
export function SearchList<T>({
  items,
  getKey,
  matches,
  selectedKey,
  onSelect,
  renderItem,
  placeholder = 'Search…',
  emptyText = 'No results',
  className,
}: {
  items: T[]
  getKey: (item: T) => string
  /** lower-cased query → does the item match */
  matches: (item: T, query: string) => boolean
  selectedKey?: string
  onSelect: (item: T) => void
  renderItem: (item: T, selected: boolean) => ReactNode
  placeholder?: string
  emptyText?: string
  className?: string
}) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const filtered = q ? items.filter((item) => matches(item, q)) : items

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="p-2">
        <label className="flex h-8 items-center gap-1.5 rounded-lg bg-accent px-2">
          <SearchIcon className="size-3.5" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-subtle"
          />
        </label>
      </div>
      <div role="listbox" className="max-h-55 overflow-y-auto px-1 pb-1">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-xs text-subtle">{emptyText}</p>
        ) : (
          filtered.map((item) => {
            const key = getKey(item)
            const selected = key === selectedKey
            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={selected}
                ref={selected ? (el) => el?.scrollIntoView({ block: 'nearest' }) : undefined}
                onClick={() => onSelect(item)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-foreground transition-colors',
                  'hover:bg-surface focus-visible:bg-surface focus-visible:outline-none',
                  selected && 'bg-accent hover:bg-accent',
                )}
              >
                {renderItem(item, selected)}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
