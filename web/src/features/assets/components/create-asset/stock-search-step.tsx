import { CirclePlusIcon } from 'lucide-react'
import { ChoiceCard } from '@/components/choice-card'
import { ChangeText } from '@/components/change-text'
import { SearchInput } from '@/components/search-input'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebounce } from '@/hooks/use-debounce'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useTickerSearch } from '../../queries'
import type { TickerResult } from '../../types'
import { AssetIconDisc } from '../asset-icon-disc'
import { StepHeading } from './step-heading'
import { YahooAttribution } from './yahoo-attribution'

/**
 * Step 2: search stocks by name or ticker (popular ones before you type) and pick one — hovering shows its price.
 * "Add Ticker" goes to manual entry instead.
 */
export function StockSearchStep({
  query,
  onQueryChange,
  selected,
  onSelect,
  onAddManually,
}: {
  query: string
  onQueryChange: (q: string) => void
  selected: TickerResult | null
  onSelect: (ticker: TickerResult) => void
  onAddManually: () => void
}) {
  const debounced = useDebounce(query, 250)
  const { data: results, isPending, isPlaceholderData } = useTickerSearch(debounced)

  return (
    <div className="flex w-full max-w-100 flex-col gap-8">
      <StepHeading title="Search for a Stock">
        Add publicly traded stocks by ticker symbol. Prices update automatically so you always see current values.
      </StepHeading>

      <div className="flex flex-col gap-8">
        <SearchInput
          value={query}
          onChange={onQueryChange}
          label="Search stocks"
          placeholder="Search.."
          autoFocus
          className="w-full bg-accent"
        />

        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={onAddManually}
            className="flex min-h-18 w-full items-center gap-3 rounded-xl bg-surface p-3 text-left transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-muted-foreground">
              <CirclePlusIcon className="size-4" aria-hidden />
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <span className="font-medium text-foreground">Add Ticker</span>
              <span className="text-xs leading-4 text-muted-foreground">Add stocks manually</span>
            </span>
          </button>

          <div
            role="radiogroup"
            aria-label="Stocks"
            aria-busy={isPending || isPlaceholderData}
            className={cn('flex flex-col gap-4 transition-opacity', isPlaceholderData && 'opacity-60')}
          >
            {isPending
              ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-18 rounded-xl" />)
              : results?.map((t) => (
                  <ChoiceCard
                    key={t.ticker}
                    label={t.name}
                    description={t.ticker}
                    icon={<AssetIconDisc asset={{ asset_type: 'stock_ticker', logo_url: t.logo_url, ticker: t.ticker }} />}
                    selected={selected?.ticker === t.ticker}
                    onSelect={() => onSelect(t)}
                    check={false}
                    className="min-h-18"
                    trailing={
                      <>
                        <span className="text-foreground">{formatMoney(t.price, t.currency)}</span>
                        <ChangeText change={{ amount: t.change, pct: t.change_pct }} currency={t.currency} compact={false} />
                      </>
                    }
                  />
                ))}
            {results?.length === 0 && !isPending && (
              <p className="py-6 text-center text-muted-foreground">No stocks match “{debounced.trim()}”</p>
            )}
          </div>
        </div>
      </div>

      <YahooAttribution />
    </div>
  )
}
