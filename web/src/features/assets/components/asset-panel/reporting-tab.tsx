import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useUpdateAsset } from '../../queries'
import type { AssetItem } from '../../types'
import { TabBody } from './tab-layout'

const CLASSIFICATIONS = [
  { value: 'cash', label: 'Investable', desc: 'Cash (Checking, Savings, Money Market)' },
  { value: 'investable', label: 'Investable', desc: 'Can be easily converted to cash (stocks, bonds, crypto, mutual funds)' },
  { value: 'non_investable', label: 'Non-Investable', desc: 'Real estate, Physical valuables, Illiquid private investments' },
]

/** Reporting tab: investability classification and ownership percentage. */
export function ReportingTab({ asset, portfolioId }: { asset: AssetItem; portfolioId: string }) {
  const [investability, setInvestability] = useState(asset.investability)
  const [ownership, setOwnership] = useState(String(asset.ownership_pct))
  const [saved, setSaved] = useState(false)
  const { mutate: update, isPending } = useUpdateAsset(portfolioId, asset.id)

  // Flash "Saved!" on the button for 2s after a save
  useEffect(() => {
    if (!saved) return
    const t = setTimeout(() => setSaved(false), 2000)
    return () => clearTimeout(t)
  }, [saved])

  const save = () =>
    update(
      { ownership_pct: parseFloat(ownership), ...(asset.investability_editable ? { investability } : {}) },
      { onSuccess: () => setSaved(true) },
    )

  return (
    <TabBody>
      <div className="flex flex-1 flex-col gap-6">
        <fieldset className="flex flex-col gap-3" disabled={!asset.investability_editable}>
          <Legend title="Asset Classification" hint="This determines whether an asset can be easily accessible as cash or not" />
          <div role="radiogroup" className="flex flex-col gap-3">
            {CLASSIFICATIONS.map((opt) => {
              const selected = investability === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setInvestability(opt.value)}
                  className={cn('flex items-start gap-2 text-left transition-opacity disabled:cursor-default', !selected && 'opacity-50')}
                >
                  <span
                    className={cn(
                      'mt-0.75 flex size-4 shrink-0 items-center justify-center rounded-full',
                      selected ? 'bg-gradient-primary' : 'bg-background shadow-panel',
                    )}
                  >
                    {selected && <span className="size-1.5 rounded-full bg-white" />}
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="leading-5.5 font-medium">{opt.label}</span>
                    <span className="text-xs leading-5 text-muted-foreground">{opt.desc}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <Legend title="Ownership Percentage" hint="This is how much of the asset you own" />
          <label className="flex h-10 items-center overflow-hidden rounded-xl bg-accent">
            <span className="px-3 py-2 leading-5.5 text-subtle">%</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step={0.01}
              value={ownership}
              onChange={(e) => setOwnership(e.target.value)}
              placeholder="0.00"
              aria-label="Ownership percentage"
              className="flex-1 bg-transparent py-2 pr-4 leading-5.5 outline-none"
            />
          </label>
        </fieldset>

        <Button size="md" onClick={save} disabled={isPending} className={cn('mt-auto w-full', saved && 'bg-success bg-none')}>
          {isPending ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>
    </TabBody>
  )
}

function Legend({ title, hint }: { title: string; hint: string }) {
  return (
    <legend className="mb-3 flex flex-col gap-1.5">
      <span className="font-medium">{title}</span>
      <span className="text-xs leading-5 text-muted-foreground">{hint}</span>
    </legend>
  )
}
