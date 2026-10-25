import { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { SheetContent } from '@/components/ui/sheet'
import { getErrorMessage } from '@/lib/api-client'
import { useAssetMutations } from '../../queries'
import type { AssetItem, TickerResult } from '../../types'
import { AssetTypeStep } from './asset-type-step'
import { DomainFlow } from './domain-flow'
import { ManualTickerStep } from './manual-ticker-step'
import { PhysicalFlow } from './physical-flow'
import { RealEstateFlow } from './real-estate-flow'
import { SheetFooter, SheetHeader, StepBody, type FlowProps } from './sheet-chrome'
import { kindForType, type TickerKindConfig } from './ticker-kinds'
import { TickerDetailsStep } from './ticker-details-step'
import { TickerSearchStep } from './ticker-search-step'
import { useLots } from './use-lots'
import { useManualTicker } from './use-manual-ticker'

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

/** Types with their own flow beyond the ticker ones. */
const FLOWS: Record<string, (props: FlowProps) => React.ReactNode> = {
  real_estate: RealEstateFlow,
  domain: DomainFlow,
  physical: PhysicalFlow,
}

/**
 * Full-height Create Asset sheet: asset type → its flow — search (stocks, crypto) → quantities, or Add Ticker; real
 * estate; a domain; physical valuables (kind → details). Every open starts over.
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

function CreateAssetFlow({ defaultCurrency = 'USD', ...props }: Omit<Props, 'open' | 'onOpenChange'> & { onClose: () => void }) {
  const [type, setType] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const ticker = kindForType(type)
  const Flow = type ? FLOWS[type] : undefined
  const flowProps: FlowProps = { ...props, defaultCurrency, onBack: () => setStarted(false) }

  // Keyed by type: each flow starts fresh, and stocks and crypto never share a search, a pick or purchases.
  if (started && ticker) return <TickerFlow key={ticker.kind} config={ticker} {...flowProps} />
  if (started && Flow && type) return <Flow key={type} {...flowProps} />

  return (
    <>
      <SheetHeader progress={0.01} />
      <StepBody>
        <AssetTypeStep selected={type} onSelect={setType} />
      </StepBody>
      <SheetFooter
        back={{ label: 'Close', onClick: props.onClose }}
        next={{ onClick: () => setStarted(true), disabled: !ticker && !Flow }}
      />
    </>
  )
}

/** Search → details, or search → Add Ticker, for one kind (stocks or crypto). */
function TickerFlow({
  config,
  portfolioId,
  folderId,
  defaultCurrency,
  onCreated,
  onClose,
  onBack,
}: FlowProps & { config: TickerKindConfig }) {
  const [step, setStep] = useState<'search' | 'details' | 'manual'>('search')
  const [query, setQuery] = useState('')
  const [ticker, setTicker] = useState<TickerResult | null>(null)
  const lots = useLots(config.quantity)
  // Separate purchases, so switching between a listed and a manual one doesn't carry them over.
  const manual = useManualTicker(config, defaultCurrency)
  const { create } = useAssetMutations(portfolioId)

  const done = {
    onSuccess: (asset: AssetItem) => {
      onCreated?.(asset)
      onClose()
    },
  }
  const submitManual = () => create.mutate(manual.toInput(folderId), done)
  const submit = () =>
    ticker &&
    create.mutate(
      {
        folder_id: folderId,
        asset_type: config.typeId,
        ticker: ticker.ticker,
        name: ticker.name,
        logo_url: ticker.logo_url,
        currency: ticker.currency,
        price: ticker.price,
        lots: lots.toLots(),
      },
      done,
    )
  const error = create.error ? getErrorMessage(create.error, 'Couldn’t create the asset. Try again.') : undefined

  return (
    <>
      <SheetHeader progress={step === 'search' ? 0.5 : 1} />
      {step === 'details' && ticker ? (
        <TickerDetailsStep config={config} ticker={ticker} lots={lots} creating={create.isPending} error={error} onCreate={submit} />
      ) : step === 'manual' ? (
        <ManualTickerStep config={config} form={manual} creating={create.isPending} error={error} onCreate={submitManual} />
      ) : (
        <StepBody>
          <TickerSearchStep
            config={config}
            query={query}
            onQueryChange={setQuery}
            selected={ticker}
            onSelect={setTicker}
            onAddManually={() => {
              create.reset()
              setStep('manual')
            }}
          />
        </StepBody>
      )}
      <SheetFooter
        back={{ label: 'Back', onClick: () => (step === 'search' ? onBack() : setStep('search')) }}
        next={step === 'search' ? { onClick: () => setStep('details'), disabled: !ticker } : undefined}
      />
    </>
  )
}
