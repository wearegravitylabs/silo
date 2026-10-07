import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, formatDateRange } from '@/lib/format'
import { cn } from '@/lib/utils'
import { TabBody, TabEmpty, TabListSkeleton } from '../../components/asset-panel/tab-layout'
import type { AssetItem } from '../../types'
import { FREQ_LABELS } from '../constants'
import { useRules } from '../queries'
import type { AutopilotRule } from '../types'
import { AddRuleDialog } from './add-rule-dialog'
import { PauseRuleDialog } from './pause-rule-dialog'
import { RuleMenu } from './rule-menu'

/** Auto-Pilot tab in the asset panel: this asset's scheduled add/remove rules. */
export function AutopilotTab({ asset, portfolioId }: { asset: AssetItem; portfolioId: string }) {
  const [adding, setAdding] = useState(false)
  const [pausing, setPausing] = useState<AutopilotRule | null>(null)
  const { data: allRules, isPending } = useRules(portfolioId)
  const rules = allRules?.filter((r) => r.target_id === asset.id) ?? []

  return (
    <>
      <TabBody>
        <div className="flex flex-1 flex-col gap-2.5">
          {isPending ? (
            <TabListSkeleton rows={2} className="h-22" />
          ) : rules.length === 0 ? (
            <TabEmpty
              icon={
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-5 text-subtle">
                  <path
                    d="M10 2l1.8 4 4.2.6-3 2.9.7 4.2L10 11.8l-3.7 1.9.7-4.2-3-2.9 4.2-.6L10 2zM3 17h14"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
              title="No Auto-Pilot Rules Added"
              body="Create a rule to automatically add or remove this asset on a schedule."
            />
          ) : (
            rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                asset={asset}
                portfolioId={portfolioId}
                onEdit={() => setAdding(true)}
                onPause={() => setPausing(rule)}
              />
            ))
          )}

          <Button size="md" onClick={() => setAdding(true)} className="mt-auto w-full">
            <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" className="size-3">
              <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add Rule
          </Button>
        </div>
      </TabBody>

      <AddRuleDialog asset={asset} portfolioId={portfolioId} open={adding} onOpenChange={setAdding} />
      {pausing && <PauseRuleDialog rule={pausing} portfolioId={portfolioId} onClose={() => setPausing(null)} />}
    </>
  )
}

function RuleCard({
  rule,
  asset,
  portfolioId,
  onEdit,
  onPause,
}: {
  rule: AutopilotRule
  asset: AssetItem
  portfolioId: string
  onEdit: () => void
  onPause: () => void
}) {
  const tone = rule.action === 'add' ? 'text-positive' : 'text-destructive'
  const amount =
    rule.units != null
      ? `${rule.units.toLocaleString()}${asset.ticker ? ` $${asset.ticker}` : ' units'}`
      : formatCurrency(rule.amount, asset.currency)

  return (
    <article className={cn('rounded-xl bg-surface px-3.5 py-3', !rule.is_active && 'opacity-55')}>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium text-subtle">{formatDateRange(rule.start_date, rule.end_date)}</span>
        <div className="flex items-center gap-1.5">
          {!rule.is_active && <span className="rounded-sm bg-accent px-1.5 py-px font-semibold text-muted-foreground">Paused</span>}
          <RuleMenu rule={rule} portfolioId={portfolioId} onEdit={onEdit} onPause={onPause} />
        </div>
      </div>
      <div className="mb-1 flex items-center justify-between">
        <span className={cn('font-semibold', tone)}>{rule.action === 'add' ? 'Add' : 'Remove'}</span>
        <span className="text-xs font-medium text-muted-foreground">{FREQ_LABELS[rule.frequency] ?? rule.frequency}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className={cn('font-semibold', tone)}>
          {rule.action === 'add' ? '+' : '−'}
          {amount}
        </span>
        {rule.next_run_at && <span className="text-subtle">Next Execution: {formatDate(rule.next_run_at)}</span>}
      </div>
    </article>
  )
}
