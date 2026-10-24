import { useState, type ReactNode } from 'react'
import { ProgressLine } from '@/components/progress-line'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SheetContent } from '@/components/ui/sheet'
import { getErrorMessage } from '@/lib/api-client'
import { useAssetMutations } from '../../queries'
import type { AssetItem, TickerResult } from '../../types'
import { AssetTypeStep } from './asset-type-step'
import { ManualTickerStep } from './manual-ticker-step'
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

/**
 * Full-height Create Asset sheet: asset type → search (stocks or crypto) → quantities and summary, or → Add Ticker
 * (one that isn't listed). Every open starts over.
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

type FlowProps = Omit<Props, 'open' | 'onOpenChange'> & { onClose: () => void }

function CreateAssetFlow(props: FlowProps) {
  const [type, setType] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const config = kindForType(type)

  if (started && config) {
    // Keyed by kind: stocks and crypto never share a search, a pick or purchases.
    return <TickerFlow key={config.kind} config={config} {...props} onBack={() => setStarted(false)} />
  }

  return (
    <>
      <SheetHeader progress={0.01} />
      <StepBody>
        <AssetTypeStep selected={type} onSelect={setType} />
      </StepBody>
      <SheetFooter back={{ label: 'Close', onClick: props.onClose }} next={{ onClick: () => setStarted(true), disabled: !config }} />
    </>
  )
}

/** Search → details, or search → Add Ticker, for one kind (stocks or crypto). */
function TickerFlow({
  config,
  portfolioId,
  folderId,
  defaultCurrency = 'USD',
  onCreated,
  onClose,
  onBack,
}: FlowProps & { config: TickerKindConfig; onBack: () => void }) {
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

function SheetHeader({ progress }: { progress: number }) {
  return (
    <div className="flex shrink-0 flex-col">
      <DialogHeader className="border-b-0 px-4 md:px-5">
        <DialogTitle>Create Asset</DialogTitle>
      </DialogHeader>
      <ProgressLine value={progress} label="Create Asset progress" />
    </div>
  )
}

/** Scrolling, centred body for the single-column steps (type, search). */
function StepBody({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 justify-center overflow-y-auto px-4 pt-10 pb-8 md:pt-14">{children}</div>
}

/** Close/Back on the left; Continue on the right when the step has one. */
function SheetFooter({ back, next }: { back: { label: string; onClick: () => void }; next?: { onClick: () => void; disabled: boolean } }) {
  return (
    <div className="flex h-15 shrink-0 items-center justify-between border-t border-border px-4 md:px-5">
      <Button variant="secondary" size="xs" onClick={back.onClick} className="px-3">
        {back.label}
      </Button>
      {next && (
        <Button size="xs" onClick={next.onClick} disabled={next.disabled} className="px-3">
          Continue
        </Button>
      )}
    </div>
  )
}
