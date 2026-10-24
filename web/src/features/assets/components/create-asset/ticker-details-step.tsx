import { TwoPane } from '@/components/two-pane'
import { currencySymbol } from '@/lib/format'
import { priceOn } from '../../api'
import type { TickerResult } from '../../types'
import { AssetIconDisc } from '../asset-icon-disc'
import { AssetSummary } from './asset-summary'
import { LotFields } from './lot-fields'
import { StepHeading } from './step-heading'
import type { TickerKindConfig } from './ticker-kinds'
import type { Lots } from './use-lots'

/**
 * Step 3 for a listed stock or coin: how many and when (one block per purchase), beside the live Asset Summary — each
 * purchase priced on its date, averaged when there are several. Stacked on phones.
 */
export function TickerDetailsStep({
  config,
  ticker,
  lots,
  creating,
  error,
  onCreate,
}: {
  config: TickerKindConfig
  ticker: TickerResult
  lots: Lots
  creating?: boolean
  error?: string
  onCreate: () => void
}) {
  const symbol = `${currencySymbol(ticker.currency)}${ticker.ticker}`
  return (
    <TwoPane
      form={
        <>
          <div className="flex flex-col items-center gap-4">
            <AssetIconDisc
              asset={{ asset_type: config.typeId, logo_url: ticker.logo_url, ticker: ticker.ticker }}
              className="size-16 [&>span]:text-base"
            />
            <StepHeading title={`Add ${symbol}${config.headingSuffix}`}>
              Add {ticker.name}
              {config.nameSuffix}
            </StepHeading>
          </div>
          <LotFields lots={lots} noun={config.noun} decimals={config.quantity.decimals} />
        </>
      }
      summary={
        <AssetSummary
          name={ticker.name}
          symbol={symbol}
          currency={ticker.currency}
          lots={lots}
          priceAt={(at) => priceOn(ticker, at)}
          canSubmit={lots.canSubmit}
          creating={creating}
          error={error}
          noun={config.noun}
          attribution={config.source}
          onCreate={onCreate}
        />
      }
    />
  )
}
