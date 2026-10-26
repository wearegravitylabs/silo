import { useState } from 'react'
import { Navigation2Icon } from 'lucide-react'
import { TabBody, TabCta, TabEmpty, TabListSkeleton } from '@/components/panel-layout'
import { RuleCard } from '@/components/rule-card'
import { useRuleConfirm } from '@/components/rule-confirm-dialog'
import { Button } from '@/components/ui/button'
import { formatDay, formatMoney } from '@/lib/format'
import { FREQUENCY_LABELS, nextRun } from '@/lib/schedule'
import { useAssetRuleMutations, useAssetRules } from '../../panel-queries'
import type { AssetItem, AssetRule } from '../../types'
import { countsUnits } from './amount-fields'
import { RuleDialog } from './rule-dialog'

/** Auto-Pilot tab: the asset's recurring adds and removals (⋯ pause or resume, edit, delete — each confirmed) and Add Rule. */
export function AutopilotTab({ asset, portfolioId }: { asset: AssetItem; portfolioId: string }) {
  // The rule outlives `open` so the dialog keeps its title while it closes.
  const [dialog, setDialog] = useState<{ open: boolean; rule: AssetRule | null }>({ open: false, rule: null })
  const { data: rules, isPending } = useAssetRules(portfolioId, asset.id)
  const { toggle, remove } = useAssetRuleMutations(portfolioId)
  const confirm = useRuleConfirm<AssetRule>({
    toggle: (rule, done) => toggle.mutate(rule.id, { onSuccess: done }),
    remove: (rule, done) => remove.mutate(rule.id, { onSuccess: done }),
    pending: toggle.isPending || remove.isPending,
  })

  return (
    <div className="flex flex-1 flex-col">
      <TabBody className="overflow-y-visible">
        {isPending ? (
          <TabListSkeleton rows={2} className="h-22" />
        ) : !rules?.length ? (
          <TabEmpty
            title="No Auto-Pilot Rule Added"
            body="Automate adding or removal to this asset. Once an Auto-Pilot Rule is added, it will appear here"
            bodyClassName="max-w-60"
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {rules.map((rule) => (
              <AssetRuleCard
                key={rule.id}
                rule={rule}
                asset={asset}
                onToggle={() => confirm.ask(rule, rule.is_active ? 'pause' : 'resume')}
                onEdit={() => setDialog({ open: true, rule })}
                onDelete={() => confirm.ask(rule, 'delete')}
              />
            ))}
          </div>
        )}
      </TabBody>

      <TabCta floating>
        <Button onClick={() => setDialog({ open: true, rule: null })}>
          <Navigation2Icon className="size-3.5 -rotate-90" aria-hidden />
          Add Rule
        </Button>
      </TabCta>

      <RuleDialog
        asset={asset}
        rule={dialog.rule}
        portfolioId={portfolioId}
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
      {confirm.dialog}
    </div>
  )
}

/** Adds are green, removals red; ticker assets count units ("+100 $MSFT"), the rest money. */
function AssetRuleCard({
  rule,
  asset,
  onToggle,
  onEdit,
  onDelete,
}: {
  rule: AssetRule
  asset: AssetItem
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const add = rule.action === 'add'
  const next = nextRun(rule)
  const amount = countsUnits(asset)
    ? `${rule.amount.toLocaleString('en-US', { maximumFractionDigits: 8, useGrouping: false })} $${asset.ticker}`
    : formatMoney(rule.amount, asset.converted_currency, { spaced: false, decimals: Number.isInteger(rule.amount) ? 0 : 2 })
  return (
    <RuleCard
      label={rule.end_date ? `${formatDay(rule.start_date)} - ${formatDay(rule.end_date)}` : formatDay(rule.start_date)}
      title={add ? 'Add' : 'Remove'}
      frequency={FREQUENCY_LABELS[rule.frequency]}
      amount={`${add ? '+' : '-'}${amount}`}
      tone={add ? 'positive' : 'negative'}
      status={next ? `Next Execution: ${formatDay(next)}` : 'Completed'}
      active={rule.is_active}
      onToggle={onToggle}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}
