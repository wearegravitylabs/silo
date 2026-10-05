import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format'
import { useTickerPreview } from '../../queries'
import type { TickerSearchResult } from '../../types'
import { isValidLot, LotFields } from './lot-fields'
import { SubmitError, SummaryList, TwoPane } from './step-layout'
import type { Lot } from './types'
import { YahooAttribution } from './yahoo-attribution'

export function StockDetailsStep({
  portfolioId,
  ticker,
  lots,
  onLotsChange,
  creating,
  onSubmit,
  error,
}: {
  portfolioId: string
  ticker: TickerSearchResult
  lots: Lot[]
  onLotsChange: (lots: Lot[]) => void
  creating: boolean
  onSubmit: () => void
  error?: string | null
}) {
  const { data: quote } = useTickerPreview(portfolioId, ticker.ticker)
  const valid = lots.every(isValidLot)
  const change = quote?.pct_change ?? 0

  return (
    <TwoPane
      form={
        <>
          <div className="flex flex-col gap-3">
            <span className="flex size-16 items-center justify-center overflow-hidden rounded-full border-[1.6px] bg-surface">
              {ticker.logo_url ? (
                <img src={ticker.logo_url} alt="" className="size-full object-cover" onError={(e) => e.currentTarget.remove()} />
              ) : (
                <span className="text-xl font-bold text-muted-foreground">{ticker.ticker.slice(0, 2)}</span>
              )}
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-2xl leading-8 font-bold">Add ${ticker.ticker} stock</h2>
              <p className="text-sm text-muted-foreground">Add {ticker.company_name} Asset</p>
            </div>
          </div>
          <LotFields lots={lots} onChange={onLotsChange} />
          <YahooAttribution />
        </>
      }
      summary={
        <>
          <SummaryList
            title="Stock preview"
            rows={[
              { label: 'Company', value: ticker.company_name },
              { label: 'Ticker', value: ticker.ticker },
              { label: 'Current Price', value: quote ? `${formatCurrency(quote.price, quote.currency)} ${quote.currency}` : '—' },
              { label: 'Exchange', value: ticker.exchange || quote?.exchange || '—' },
              {
                label: 'Return',
                value: quote ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '—',
                valueClassName: quote
                  ? change >= 0
                    ? 'font-semibold text-positive'
                    : 'font-semibold text-negative'
                  : 'text-muted-foreground',
              },
            ]}
          />
          <Button size="lg" onClick={onSubmit} disabled={!valid || creating} className="h-8 w-full rounded-10">
            {creating ? 'Adding…' : `Add $${ticker.ticker}`}
          </Button>
          {error && <SubmitError message={error} />}
          <YahooAttribution />
        </>
      }
    />
  )
}
