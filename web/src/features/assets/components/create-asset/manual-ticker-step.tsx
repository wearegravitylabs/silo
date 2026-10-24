import { FormField } from '@/components/form-field'
import { MoneyInput } from '@/components/money-input'
import { TwoPane } from '@/components/two-pane'
import { Input } from '@/components/ui/input'
import { currencySymbol } from '@/lib/format'
import { AssetSummary } from './asset-summary'
import { ImageUploadDisc } from './image-upload-disc'
import { LotFields } from './lot-fields'
import { StepHeading } from './step-heading'
import type { TickerKindConfig } from './ticker-kinds'
import type { ManualTicker } from './use-manual-ticker'

/** A blank in the heading until its field is filled ("Add __ stock"). */
const Blank = ({ wide = false }: { wide?: boolean }) => <span className="text-subtle">{wide ? '_ _' : '__'}</span>

/**
 * Step 3 for a stock or coin that isn't listed: you set its name, ticker and price (coins in USD), then the purchases.
 * Stacked on phones.
 */
export function ManualTickerStep({
  config,
  form,
  creating,
  error,
  onCreate,
}: {
  config: TickerKindConfig
  form: ManualTicker
  creating?: boolean
  error?: string
  onCreate: () => void
}) {
  const { values, set, lots } = form
  const name = values.name.trim()
  const symbol = values.ticker ? `${currencySymbol(values.currency)}${values.ticker}` : ''

  return (
    <TwoPane
      form={
        <>
          <div className="flex flex-col items-center gap-4">
            <ImageUploadDisc value={values.imageUrl} onChange={set.imageUrl} />
            <StepHeading
              title={
                <>
                  Add {symbol || <Blank wide />}
                  {config.headingSuffix}
                </>
              }
            >
              Add {name || <Blank />}
              {config.nameSuffix}
            </StepHeading>
          </div>

          <div className="flex flex-col gap-5">
            <FormField label="Name" htmlFor="manual-name" required>
              <Input
                id="manual-name"
                value={values.name}
                onChange={(e) => set.name(e.target.value)}
                placeholder={config.namePlaceholder}
                autoComplete="off"
              />
            </FormField>
            <FormField label="Ticker" htmlFor="manual-ticker" required>
              <Input
                id="manual-ticker"
                value={values.ticker}
                onChange={(e) => set.ticker(e.target.value)}
                placeholder={config.tickerPlaceholder}
                autoComplete="off"
              />
            </FormField>
            <FormField label="Price per Quantity" htmlFor="manual-price" required>
              {/* Coins are priced in USD only: no currency menu */}
              <MoneyInput
                id="manual-price"
                value={values.priceText}
                onChange={set.priceText}
                currency={values.currency}
                onCurrencyChange={set.currency}
              />
            </FormField>
          </div>

          <div className="-mt-3 border-t border-border pt-5">
            <LotFields lots={lots} noun={config.noun} decimals={config.quantity.decimals} />
          </div>
        </>
      }
      summary={
        <AssetSummary
          name={name}
          symbol={symbol}
          currency={values.currency}
          lots={lots}
          priceAt={() => values.price}
          canSubmit={form.canSubmit}
          creating={creating}
          error={error}
          noun={config.noun}
          onCreate={onCreate}
        />
      }
    />
  )
}
