import { TwoPane } from '@/components/two-pane'
import { currencySymbol } from '@/lib/format'
import { priceOn } from '../../api'
import type { TickerResult } from '../../types'
import { AssetIconDisc } from '../asset-icon-disc'
import { AssetSummary } from './asset-summary'
import { LotFields } from './lot-fields'
import { StepHeading } from './step-heading'
import type { StockLots } from './use-stock-lots'

/**
 * Step 3 for a market stock: how many and when (one block per purchase), beside the live Asset Summary — each
 * purchase priced on its date, averaged when there are several. Stacked on phones.
 */
export function StockDetailsStep({
  stock,
  lots,
  creating,
  error,
  onCreate,
}: {
  stock: TickerResult
  lots: StockLots
  creating?: boolean
  error?: string
  onCreate: () => void
}) {
  const symbol = `${currencySymbol(stock.currency)}${stock.ticker}`
  return (
    <TwoPane
      form={
        <>
          <div className="flex flex-col items-center gap-4">
            <AssetIconDisc
              asset={{ asset_type: 'stock_ticker', logo_url: stock.logo_url, ticker: stock.ticker }}
              className="size-16 [&>span]:text-base"
            />
            <StepHeading title={`Add ${symbol} stock`}>Add {stock.name} Asset</StepHeading>
          </div>
          <LotFields lots={lots} />
        </>
      }
      summary={
        <AssetSummary
          name={stock.name}
          symbol={symbol}
          currency={stock.currency}
          lots={lots}
          priceAt={(at) => priceOn(stock, at)}
          canSubmit={lots.canSubmit}
          creating={creating}
          error={error}
          attribution
          onCreate={onCreate}
        />
      }
    />
  )
}
