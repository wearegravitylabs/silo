import { useState } from 'react'
import { CloseIcon, PlusCircleIcon, SearchIcon } from '@/components/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { useTickerSearch } from '../../queries'
import type { TickerSearchResult } from '../../types'
import { StepHeading } from './step-heading'
import { YahooAttribution } from './yahoo-attribution'

const OPTION =
  'flex h-18 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none'

export function StockSearchStep({
  portfolioId,
  selected,
  onSelect,
  onAddManually,
}: {
  portfolioId: string
  selected: TickerSearchResult | null
  onSelect: (t: TickerSearchResult | null) => void
  onAddManually: () => void
}) {
  const [input, setInput] = useState('')
  const query = useDebounce(input.trim(), 350)
  const { data: results, isFetching } = useTickerSearch(portfolioId, query)

  return (
    <div className="flex flex-1 justify-center py-10">
      <div className="flex w-100 flex-col gap-6">
        <StepHeading
          title="Search for a Stock"
          description="Add publicly traded stocks by ticker symbol. Prices update automatically so you always see current values."
        />

        <label className="flex h-10 items-center gap-2 rounded-10 bg-accent px-3">
          <SearchIcon />
          <input
            autoFocus
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              if (selected) onSelect(null)
            }}
            placeholder="Search by name or ticker..."
            aria-label="Search stocks"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-subtle"
          />
          {input && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setInput('')
                onSelect(null)
              }}
              className="flex"
            >
              <CloseIcon className="size-3.5" />
            </button>
          )}
        </label>

        <div className="flex flex-col gap-1" role="listbox" aria-label="Search results">
          <button type="button" onClick={onAddManually} className={cn(OPTION, 'bg-surface hover:opacity-90')}>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle">
              <PlusCircleIcon className="size-5" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">Add manually</span>
              <span className="text-xs text-muted-foreground">Enter stock details manually</span>
            </span>
          </button>

          {!query ? (
            <Hint>Type a company name or ticker to search</Hint>
          ) : isFetching && !results?.length ? (
            Array.from({ length: 3 }, (_, i) => (
              <div key={i} className={cn(OPTION, 'pointer-events-none')} aria-hidden>
                <Skeleton className="size-10 rounded-full" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))
          ) : !results?.length ? (
            <Hint>No results for “{query}”</Hint>
          ) : (
            results.map((t) => (
              <button
                key={t.ticker}
                type="button"
                role="option"
                aria-selected={selected?.ticker === t.ticker}
                onClick={() => onSelect(t)}
                className={cn(
                  OPTION,
                  'bg-background hover:border-primary-dark/40 aria-selected:border-primary-dark aria-selected:bg-primary-subtle',
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-[1.5px] bg-surface">
                  {t.logo_url ? (
                    <img src={t.logo_url} alt="" className="size-full object-cover" onError={(e) => e.currentTarget.remove()} />
                  ) : (
                    <span className="text-13 font-bold text-muted-foreground">{t.ticker.slice(0, 2)}</span>
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-semibold">{t.company_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {t.ticker} · {t.exchange}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>

        <YahooAttribution />
      </div>
    </div>
  )
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="flex h-15 items-center justify-center text-13 text-subtle">{children}</p>
}
