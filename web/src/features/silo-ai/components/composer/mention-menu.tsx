import { useEffect, useRef } from 'react'
import { AtSignIcon } from 'lucide-react'
import { SearchIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import type { MentionOption } from '../../mock-data'

/**
 * The @mention picker above the composer: search, Partners, Sections. Presentational — the composer
 * owns the query, the highlighted item and what picking does.
 */
export function MentionMenu({
  options,
  query,
  onQueryChange,
  activeIndex,
  onActiveChange,
  onPick,
  onKeyDown,
  focusSearch,
}: {
  options: MentionOption[]
  query: string
  onQueryChange: (query: string) => void
  activeIndex: number
  onActiveChange: (index: number) => void
  onPick: (option: MentionOption) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  /** Opened from the @ button: put the cursor in the search field instead of the composer. */
  focusSearch: boolean
}) {
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (focusSearch) searchRef.current?.focus()
  }, [focusSearch])

  // Keep the highlighted item in view while arrowing through the list.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const partners = options.filter((o) => o.kind === 'partner')
  const sections = options.filter((o) => o.kind === 'section')

  return (
    <div
      role="dialog"
      aria-label="Mention"
      className="absolute inset-x-0 bottom-full z-20 mb-2 flex max-h-96 animate-rise flex-col overflow-hidden rounded-xl bg-background shadow-dropdown"
    >
      <div className="p-2 pb-1">
        <label className="flex h-8 items-center gap-2 rounded-lg bg-accent px-3">
          <SearchIcon className="size-4" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search"
            aria-label="Search mentions"
            className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-subtle"
          />
        </label>
      </div>

      <div ref={listRef} role="listbox" className="flex flex-col overflow-y-auto px-2 pb-2">
        {options.length === 0 && <p className="px-2 py-6 text-center text-xs">No matches</p>}
        {partners.length > 0 && <GroupLabel>Partners</GroupLabel>}
        {partners.map((o) => (
          <Item key={o.id} option={o} index={options.indexOf(o)} {...{ activeIndex, onActiveChange, onPick }} />
        ))}
        {sections.length > 0 && <GroupLabel>Sections</GroupLabel>}
        {sections.map((o) => (
          <Item key={o.id} option={o} index={options.indexOf(o)} {...{ activeIndex, onActiveChange, onPick }} />
        ))}
      </div>
    </div>
  )
}

function GroupLabel({ children }: { children: string }) {
  return <span className="px-2 pt-2 pb-1 text-xs leading-5 text-muted-foreground">{children}</span>
}

function Item({
  option,
  index,
  activeIndex,
  onActiveChange,
  onPick,
}: {
  option: MentionOption
  index: number
  activeIndex: number
  onActiveChange: (index: number) => void
  onPick: (option: MentionOption) => void
}) {
  const active = index === activeIndex
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      data-active={active}
      // mousedown, not click: keep focus in the composer so the caret position survives
      onMouseDown={(e) => {
        e.preventDefault()
        onPick(option)
      }}
      onMouseEnter={() => onActiveChange(index)}
      className={cn('flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors', active && 'bg-accent')}
    >
      {option.kind === 'partner' ? (
        <span
          aria-hidden
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full font-heading text-base font-bold',
            option.tone === 'lime' ? 'bg-highlight text-foreground' : 'bg-primary-dark text-primary-foreground',
          )}
        >
          {option.initials}
        </span>
      ) : (
        <AtSignIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      )}
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-medium text-foreground">{option.name}</span>
        <span className="truncate text-xs leading-4 text-muted-foreground">
          {option.kind === 'partner' ? option.email : option.description}
        </span>
      </span>
    </button>
  )
}
