import { useState } from 'react'
import { toast } from 'sonner'
import { parseNumber } from '@/components/number-input'
import { TabBody } from '@/components/panel-layout'
import { PercentInput } from '@/components/percent-input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { useUpdateAsset } from '../../panel-queries'
import type { AssetItem, Investability } from '../../types'

const CLASSES: Array<{ value: Investability; label: string; description: string }> = [
  { value: 'investable', label: 'Investable', description: 'Can be easily converted to cash (stocks, bonds, crypto, mutual funds)' },
  { value: 'non_investable', label: 'Non-Investable', description: 'Real estate, Physical valuables, Illiquid private investments' },
]

/**
 * Reporting tab: whether the asset counts as investable (saved on pick) and the share of it you own (saved when the
 * field is left; the value scales with it).
 */
export function ReportingTab({ asset, portfolioId }: { asset: AssetItem; portfolioId: string }) {
  const { mutate } = useUpdateAsset(portfolioId, asset.id)
  const [share, setShare] = useState(asset.ownership_pct.toFixed(2))
  const pct = parseNumber(share)
  const invalid = pct === null || pct <= 0 || pct > 100
  const failed = () => toast.error('Couldn’t save this change. Try again.')

  const saveShare = () => {
    if (invalid || pct === asset.ownership_pct) return
    mutate({ ownership_pct: pct }, { onError: failed })
  }

  return (
    <TabBody className="gap-8 overflow-y-visible">
      <section className="flex flex-col gap-4">
        <Heading title="Asset Classification" body="This determines whether an asset can be easily accessible as cash or not" />
        <RadioGroup
          value={asset.investability}
          onValueChange={(v) => mutate({ investability: v as Investability }, { onError: failed })}
          aria-label="Asset classification"
          className="gap-4"
        >
          {CLASSES.map((c) => {
            const checked = asset.investability === c.value
            return (
              <label key={c.value} className="flex cursor-pointer items-start gap-2">
                <RadioGroupItem value={c.value} className="mt-0.75" />
                <span className="flex flex-col gap-1">
                  <span className={cn('leading-5.5 transition-colors', checked ? 'text-foreground' : 'text-muted-foreground')}>
                    {c.label}
                  </span>
                  <span className={cn('text-xs leading-4 transition-colors', checked ? 'text-muted-foreground' : 'text-subtle')}>
                    {c.description}
                  </span>
                </span>
              </label>
            )
          })}
        </RadioGroup>
      </section>

      <section className="flex flex-col gap-4">
        <Heading title="Ownership Percentage" body="This is how much of the asset you own" />
        <div className="flex flex-col gap-1.5" onBlur={saveShare}>
          <PercentInput id="ownership-pct" value={share} onChange={setShare} invalid={invalid} placeholder="100.00" />
          {invalid && <span className="text-xs leading-5 text-destructive">Enter a share between 0 and 100%</span>}
        </div>
      </section>
    </TabBody>
  )
}

function Heading({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="font-sans text-sm leading-5.5 font-medium tracking-normal text-foreground">{title}</h3>
      <p className="text-xs leading-4 text-muted-foreground">{body}</p>
    </div>
  )
}
