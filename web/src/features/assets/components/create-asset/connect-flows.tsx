import { useState } from 'react'
import { ChoiceCard } from '@/components/choice-card'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/api-client'
import { CRYPTO_PROVIDERS } from '../../constants'
import { useAssetMutations } from '../../queries'
import { AssetIconDisc } from '../asset-icon-disc'
import { SheetFooter, SheetHeader, StepBody, type FlowProps } from './sheet-chrome'
import { StepHeading } from './step-heading'

/** What connecting through an aggregator does and doesn't mean (shown under both connect steps). */
function AggregatorNotes() {
  return (
    <ul className="flex list-disc flex-col gap-1 rounded-xl bg-surface py-4 pr-5 pl-9 text-xs leading-5 text-muted-foreground">
      <li>We use an external aggregator</li>
      <li>We do not have access to your accounts</li>
      <li>This connection is not 100% sure. There are downtimes sometimes</li>
      <li>The only 100% guarantee is doing it manually.</li>
    </ul>
  )
}

/** The Plaid lattice mark. */
function PlaidMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <g className="fill-none stroke-ink" strokeWidth="3.2" strokeLinejoin="round">
        <path d="M24 4 34 14 24 24 14 14Z" />
        <path d="M24 24 34 34 24 44 14 34Z" />
        <path d="M14 14 24 24 14 34 4 24Z" />
        <path d="M34 14 44 24 34 34 24 24Z" />
      </g>
    </svg>
  )
}

function useConnect({ portfolioId, folderId, onCreated, onClose }: FlowProps) {
  const { connect } = useAssetMutations(portfolioId)
  return {
    pending: connect.isPending,
    error: connect.error ? getErrorMessage(connect.error, 'Couldn’t connect. Try again.') : undefined,
    run: (provider: string) =>
      connect.mutate(
        { folder_id: folderId, provider },
        {
          onSuccess: (asset) => {
            onCreated?.(asset)
            onClose()
          },
        },
      ),
  }
}

/** Bank Connections → Connect to Plaid: what it does, Connect Bank, and the aggregator caveats. */
export function BankFlow(props: FlowProps) {
  const connect = useConnect(props)
  return (
    <>
      <SheetHeader progress={0.5} />
      {/* m-auto centres without clipping the top when the screen is short; the padding stays inside the scroller */}
      <div className="flex flex-1 overflow-y-auto px-4">
        <div className="m-auto flex w-full max-w-100 flex-col items-center gap-8 py-10">
          <div className="flex flex-col items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-full border border-border bg-background">
              <PlaidMark className="size-9" />
            </span>
            <StepHeading title="Connect to Plaid">
              Connect your checking, savings, and money market accounts. Balances sync automatically so your net worth stays up to date.
            </StepHeading>
          </div>
          <Button onClick={() => connect.run('plaid')} loading={connect.pending} loadingText="Connecting…">
            Connect Bank
          </Button>
          {connect.error && <p className="text-center text-xs text-destructive">{connect.error}</p>}
          <AggregatorNotes />
        </div>
      </div>
      <SheetFooter back={{ label: 'Back', onClick: props.onBack }} />
    </>
  )
}

/** Crypto Exchanges/Wallet → Select Crypto Exchange: pick one, then Continue connects it. */
export function CryptoWalletFlow(props: FlowProps) {
  const [provider, setProvider] = useState<string | null>(null)
  const connect = useConnect(props)
  return (
    <>
      <SheetHeader progress={0.5} />
      <StepBody>
        <div className="flex w-full max-w-100 flex-col gap-8">
          <StepHeading title="Select Crypto Exchange">
            Connect exchanges (Coinbase, Binance, Kraken) or wallet addresses. Your crypto balances will update automatically.
          </StepHeading>
          <div role="radiogroup" aria-label="Crypto exchanges and wallets" className="flex flex-col gap-4">
            {CRYPTO_PROVIDERS.map((p) => (
              <ChoiceCard
                key={p.id}
                label={p.name}
                description={p.kind}
                icon={<AssetIconDisc asset={{ asset_type: 'crypto_wallet', logo_url: null, ticker: p.name }} />}
                selected={p.id === provider}
                onSelect={() => setProvider(p.id)}
                check={false}
                className="min-h-18"
              />
            ))}
          </div>
          {connect.error && <p className="text-center text-xs text-destructive">{connect.error}</p>}
          <AggregatorNotes />
        </div>
      </StepBody>
      <SheetFooter
        back={{ label: 'Back', onClick: props.onBack }}
        next={{
          onClick: () => provider && connect.run(provider),
          disabled: !provider,
          loading: connect.pending,
          loadingLabel: 'Connecting…',
        }}
      />
    </>
  )
}
