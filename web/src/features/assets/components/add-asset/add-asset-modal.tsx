import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getErrorMessage } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { useCreateAsset } from '../../queries'
import type { CreateAssetInput, TickerSearchResult } from '../../types'
import { ManualStockStep } from './manual-stock-step'
import { StockDetailsStep } from './stock-details-step'
import { StockSearchStep } from './stock-search-step'
import { TypeSelectStep } from './type-select-step'
import type { AddAssetStep, Lot, ManualStockForm } from './types'

const PROGRESS: Record<AddAssetStep, string> = {
  'type-select': 'w-2.5',
  'stock-search': 'w-1/2',
  'stock-details': 'w-full',
  'stock-manual': 'w-full',
}

const EMPTY_LOT: Lot = { quantity: '', date: '' }

interface Props {
  portfolioId: string
  folderId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Full-height sheet: type → ticker search → lots (or manual entry) → create. */
export function AddAssetModal({ open, onOpenChange, ...props }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        overlayClassName="bg-ink/60"
        className="top-auto bottom-0 h-[min(904px,calc(100dvh-24px))] max-h-none w-full max-w-none animate-sheet-up rounded-t-2xl rounded-b-none shadow-none"
      >
        {/* Mounted only while open, so every open starts from step one */}
        <AddAssetFlow {...props} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function AddAssetFlow({ portfolioId, folderId, onClose: close }: Omit<Props, 'open' | 'onOpenChange'> & { onClose: () => void }) {
  const [step, setStep] = useState<AddAssetStep>('type-select')
  const [type, setType] = useState<string | null>(null)
  const [ticker, setTicker] = useState<TickerSearchResult | null>(null)
  const [lots, setLots] = useState<Lot[]>([EMPTY_LOT])
  const [manual, setManual] = useState<ManualStockForm>({
    name: '',
    ticker: '',
    price: '',
    currency: 'USD',
    lots: [EMPTY_LOT],
    imageUrl: null,
  })
  const [error, setError] = useState<string | null>(null)
  const { mutate: create, isPending: creating } = useCreateAsset(portfolioId)

  const toLots = (list: Lot[]) =>
    list.map((l) => ({
      quantity: parseFloat(l.quantity),
      acquisition_date: l.date,
    }))

  const submit = () => {
    if (!folderId) return setError('Create a folder first, then add assets to it.')
    const input: CreateAssetInput =
      step === 'stock-manual'
        ? {
            folder_id: folderId,
            asset_type: 'stock_manual',
            name: manual.name.trim(),
            ticker: manual.ticker.trim() || undefined,
            current_price: parseFloat(manual.price),
            currency: manual.currency,
            image_url: manual.imageUrl ?? undefined,
            lots: toLots(manual.lots),
          }
        : {
            folder_id: folderId,
            asset_type: 'stock_ticker',
            ticker: ticker!.ticker,
            lots: toLots(lots),
          }

    create(input, {
      onSuccess: close,
      onError: (err) => setError(getErrorMessage(err, 'Something went wrong. Please try again.')),
    })
  }

  const title = {
    'type-select': 'Choose an Asset Type',
    'stock-search': 'Search for a Stock',
    'stock-manual': 'Add Manually',
    'stock-details': ticker ? `Add $${ticker.ticker} stock` : 'Add stock',
  }[step]

  const back = () => {
    if (step === 'type-select') close()
    else setStep(step === 'stock-search' ? 'type-select' : 'stock-search')
  }
  const canContinue = (step === 'type-select' && type === 'stock_ticker') || (step === 'stock-search' && ticker !== null)
  const next = () => setStep(step === 'type-select' ? 'stock-search' : 'stock-details')

  return (
    <>
      <DialogHeader className="px-6">
        <DialogTitle className="font-semibold tracking-normal">{title}</DialogTitle>
      </DialogHeader>

      <div className="h-0.5 shrink-0 bg-accent">
        <div className={cn('h-full bg-primary-dark transition-[width] duration-300', PROGRESS[step])} />
      </div>

      <div className={cn('flex flex-1 flex-col', step === 'stock-details' ? 'overflow-hidden' : 'overflow-y-auto')}>
        {step === 'type-select' && <TypeSelectStep selected={type} onSelect={setType} />}
        {step === 'stock-search' && (
          <StockSearchStep portfolioId={portfolioId} selected={ticker} onSelect={setTicker} onAddManually={() => setStep('stock-manual')} />
        )}
        {step === 'stock-manual' && (
          <ManualStockStep
            form={manual}
            onChange={(f) => {
              setError(null)
              setManual(f)
            }}
            creating={creating}
            onSubmit={submit}
            error={error}
          />
        )}
        {step === 'stock-details' && ticker && (
          <StockDetailsStep
            portfolioId={portfolioId}
            ticker={ticker}
            lots={lots}
            onLotsChange={setLots}
            creating={creating}
            onSubmit={submit}
            error={error}
          />
        )}
      </div>

      <div className="flex h-15 shrink-0 items-center justify-between border-t px-6">
        <Button variant="secondary" onClick={back} className="px-4 font-medium">
          Back
        </Button>
        {(step === 'type-select' || step === 'stock-search') && (
          <Button onClick={next} disabled={!canContinue} className="px-5">
            Continue
          </Button>
        )}
      </div>
    </>
  )
}
