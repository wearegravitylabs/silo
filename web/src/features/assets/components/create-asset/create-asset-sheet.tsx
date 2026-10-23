import { useState } from 'react'
import { ProgressLine } from '@/components/progress-line'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SheetContent } from '@/components/ui/sheet'
import { getErrorMessage } from '@/lib/api-client'
import { useAssetMutations } from '../../queries'
import type { AssetItem, TickerResult } from '../../types'
import { AssetTypeStep } from './asset-type-step'
import { ManualStockStep } from './manual-stock-step'
import { StockDetailsStep } from './stock-details-step'
import { StockSearchStep } from './stock-search-step'
import { useManualStock } from './use-manual-stock'
import { useStockLots } from './use-stock-lots'

type Step = 'type' | 'search' | 'details' | 'manual'

// How far the header line runs on each step: a sliver, halfway, all the way.
const PROGRESS: Record<Step, number> = { type: 0.01, search: 0.5, details: 1, manual: 1 }

interface Props {
  portfolioId: string
  /** Folder the new asset goes into (the selected tab) */
  folderId: string | null
  /** Currency a manual stock is priced in to start with (the portfolio's) */
  defaultCurrency?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** After the asset is saved (e.g. to show a toast). The sheet closes itself. */
  onCreated?: (asset: AssetItem) => void
}

/**
 * Full-height Create Asset sheet: asset type → stock search → quantities and summary, or → Add Ticker (a manual stock).
 * Every open starts over.
 */
export function CreateAssetSheet({ open, onOpenChange, ...props }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby={undefined}>
        {/* Mounted only while open, so every open starts on step one */}
        <CreateAssetFlow {...props} onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Dialog>
  )
}

function CreateAssetFlow({
  portfolioId,
  folderId,
  defaultCurrency = 'USD',
  onCreated,
  onClose,
}: Omit<Props, 'open' | 'onOpenChange'> & { onClose: () => void }) {
  const [step, setStep] = useState<Step>('type')
  const [type, setType] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [stock, setStock] = useState<TickerResult | null>(null)
  const lots = useStockLots()
  // Separate purchases, so switching between a listed and a manual stock doesn't carry them over.
  const manual = useManualStock(defaultCurrency)
  const { create } = useAssetMutations(portfolioId)

  const done = {
    onSuccess: (asset: AssetItem) => {
      onCreated?.(asset)
      onClose()
    },
  }

  const submitManual = () => create.mutate(manual.toInput(folderId), done)

  const submit = () =>
    stock &&
    create.mutate(
      {
        folder_id: folderId,
        asset_type: 'stock_ticker',
        ticker: stock.ticker,
        name: stock.name,
        logo_url: stock.logo_url,
        currency: stock.currency,
        price: stock.price,
        lots: lots.toLots(),
      },
      done,
    )

  const error = create.error ? getErrorMessage(create.error, 'Couldn’t create the asset. Try again.') : undefined

  return (
    <>
      <div className="flex shrink-0 flex-col">
        <DialogHeader className="border-b-0 px-4 md:px-5">
          <DialogTitle>Create Asset</DialogTitle>
        </DialogHeader>
        <ProgressLine value={PROGRESS[step]} label="Create Asset progress" />
      </div>

      {step === 'details' && stock ? (
        <StockDetailsStep stock={stock} lots={lots} creating={create.isPending} error={error} onCreate={submit} />
      ) : step === 'manual' ? (
        <ManualStockStep form={manual} creating={create.isPending} error={error} onCreate={submitManual} />
      ) : (
        <div className="flex flex-1 justify-center overflow-y-auto px-4 pt-10 pb-8 md:pt-14">
          {step === 'type' ? (
            <AssetTypeStep selected={type} onSelect={setType} />
          ) : (
            <StockSearchStep
              query={query}
              onQueryChange={setQuery}
              selected={stock}
              onSelect={setStock}
              onAddManually={() => {
                create.reset()
                setStep('manual')
              }}
            />
          )}
        </div>
      )}

      <div className="flex h-15 shrink-0 items-center justify-between border-t border-border px-4 md:px-5">
        <Button
          variant="secondary"
          size="xs"
          onClick={() => (step === 'type' ? onClose() : setStep(step === 'search' ? 'type' : 'search'))}
          className="px-3"
        >
          {step === 'type' ? 'Close' : 'Back'}
        </Button>
        {(step === 'type' || step === 'search') && (
          <Button
            size="xs"
            onClick={() => setStep(step === 'type' ? 'search' : 'details')}
            disabled={step === 'type' ? type !== 'stock_ticker' : !stock}
            className="px-3"
          >
            Continue
          </Button>
        )}
      </div>
    </>
  )
}
