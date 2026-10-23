import { FormField } from '@/components/form-field'
import { MoneyInput } from '@/components/money-input'
import { TwoPane } from '@/components/two-pane'
import { Input } from '@/components/ui/input'
import { currencySymbol } from '@/lib/format'
import { AssetSummary } from './asset-summary'
import { ImageUploadDisc } from './image-upload-disc'
import { LotFields } from './lot-fields'
import { StepHeading } from './step-heading'
import type { ManualStock } from './use-manual-stock'

/** A blank in the heading until its field is filled ("Add __ stock"). */
const Blank = ({ wide = false }: { wide?: boolean }) => <span className="text-subtle">{wide ? '_ _' : '__'}</span>

/** Step 3 for a stock that isn't listed: you set its name, ticker and price, then the purchases. Stacked on phones. */
export function ManualStockStep({
  form,
  creating,
  error,
  onCreate,
}: {
  form: ManualStock
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
            <StepHeading title={<>Add {symbol || <Blank wide />} stock</>}>Add {name || <Blank />} Asset</StepHeading>
          </div>

          <div className="flex flex-col gap-5">
            <FormField label="Name" htmlFor="manual-name" required>
              <Input
                id="manual-name"
                value={values.name}
                onChange={(e) => set.name(e.target.value)}
                placeholder="Enter stock name"
                autoComplete="off"
              />
            </FormField>
            <FormField label="Ticker" htmlFor="manual-ticker" required>
              <Input
                id="manual-ticker"
                value={values.ticker}
                onChange={(e) => set.ticker(e.target.value)}
                placeholder="Enter stock ticker"
                autoComplete="off"
              />
            </FormField>
            <FormField label="Price per Quantity" htmlFor="manual-price" required>
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
            <LotFields lots={lots} />
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
          onCreate={onCreate}
        />
      }
    />
  )
}
