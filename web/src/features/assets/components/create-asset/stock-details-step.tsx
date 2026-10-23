import { CirclePlusIcon, XIcon } from 'lucide-react'
import { DateField, todayIso } from '@/components/date-field'
import { FormField } from '@/components/form-field'
import { InfoDotIcon } from '@/components/icons'
import { formatNumber, NumberInput } from '@/components/number-input'
import { SubmitError, SummaryList } from '@/components/summary-list'
import { TwoPane } from '@/components/two-pane'
import { Button } from '@/components/ui/button'
import { InputGroup } from '@/components/ui/input-group'
import { formatDayMonthTime, formatMoney } from '@/lib/format'
import type { TickerResult } from '../../types'
import { AssetIconDisc } from '../asset-icon-disc'
import { StepHeading } from './step-heading'
import type { StockLots } from './use-stock-lots'
import { YahooAttribution } from './yahoo-attribution'

/**
 * Step 3: how many of the stock and when (one block per purchase), beside the live Asset Summary and Create Asset.
 * Stacked on phones.
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
  const money = (n: number) => formatMoney(n, stock.currency, { spaced: false })
  const symbol = `$${stock.ticker}`

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

          <div className="flex flex-col gap-6">
            {lots.rows.map((lot, i) => (
              <div key={lot.key} className="relative flex animate-rise flex-col gap-4">
                {i > 0 && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Remove this quantity"
                    onClick={() => lots.remove(lot.key)}
                    className="absolute top-0 right-0"
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                )}
                <FormField
                  label="Quantity"
                  htmlFor={`qty-${lot.key}`}
                  required
                  error={lot.error}
                  hint={
                    <p className="flex items-center gap-1 text-xs leading-5 text-muted-foreground">
                      <InfoDotIcon />
                      Quantity of stocks acquired
                    </p>
                  }
                >
                  <InputGroup invalid={!!lot.error}>
                    <NumberInput
                      id={`qty-${lot.key}`}
                      value={lot.quantityText}
                      onChange={(text) => lots.setQuantity(lot.key, text)}
                      decimals={0}
                      placeholder="0"
                      invalid={!!lot.error}
                    />
                  </InputGroup>
                </FormField>
                <FormField label="Acquisition Date" htmlFor={`date-${lot.key}`}>
                  <DateField
                    id={`date-${lot.key}`}
                    value={lot.acquiredAt}
                    onChange={(v) => lots.setAcquiredAt(lot.key, v)}
                    max={todayIso()}
                    withTime
                  />
                </FormField>
              </div>
            ))}

            <Button variant="link" size="xs" onClick={lots.add} className="self-center">
              <CirclePlusIcon className="size-3.5" aria-hidden />
              Add More Quantity
            </Button>
          </div>
        </>
      }
      summary={
        <>
          <SummaryList
            title="Asset Summary"
            rows={[
              { label: 'Asset Name', value: stock.name },
              { label: 'Total Quantity', value: `${formatNumber(lots.totalQuantity, 0)} ${symbol}` },
              { label: 'Acquisition Date', value: formatDayMonthTime(lots.firstAcquiredAt) },
              { label: 'Price per Quantity', value: money(stock.price) },
              { label: 'Total Value', value: money(lots.totalQuantity * stock.price), valueClassName: 'font-semibold' },
            ]}
          />
          <div className="flex flex-col gap-3">
            <Button onClick={onCreate} disabled={!lots.canSubmit} loading={creating} loadingText="Creating…" className="w-full">
              Create Asset
            </Button>
            {error && <SubmitError message={error} />}
            <YahooAttribution />
          </div>
        </>
      }
    />
  )
}
