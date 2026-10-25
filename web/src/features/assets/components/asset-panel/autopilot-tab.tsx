import { Navigation2Icon } from 'lucide-react'
import { TabBody, TabCta, TabEmpty, TabListSkeleton } from '@/components/panel-layout'
import { RuleCard } from '@/components/rule-card'
import { Button } from '@/components/ui/button'
import { formatDay, formatMoney } from '@/lib/format'
import { FREQUENCY_LABELS, nextRun } from '@/lib/schedule'
import { useAssetRuleMutations, useAssetRules } from '../../panel-queries'
import type { AssetItem, AssetRule } from '../../types'

/**
 * Auto-Pilot tab: the asset's recurring adds and removals (pause, delete). TODO: Add Rule (and editing) waits on a
 * design for the rule dialog.
 */
export function AutopilotTab({ asset, portfolioId }: { asset: AssetItem; portfolioId: string }) {
  const { data: rules, isPending } = useAssetRules(portfolioId, asset.id)
  const { toggle, remove } = useAssetRuleMutations(portfolioId)

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
                onToggle={() => toggle.mutate(rule.id)}
                onDelete={() => remove.mutate(rule.id)}
              />
            ))}
          </div>
        )}
      </TabBody>

      <TabCta floating>
        <Button disabled>
          <Navigation2Icon className="size-3.5 -rotate-90" aria-hidden />
          Add Rule
        </Button>
      </TabCta>
    </div>
  )
}

/** Adds are green, removals red; ticker assets count units ("+100 $MSFT"), the rest money. */
function AssetRuleCard({
  rule,
  asset,
  onToggle,
  onDelete,
}: {
  rule: AssetRule
  asset: AssetItem
  onToggle: () => void
  onDelete: () => void
}) {
  const add = rule.action === 'add'
  const next = nextRun(rule)
  const amount =
    asset.ticker && asset.total_quantity != null
      ? `${rule.amount} $${asset.ticker}`
      : formatMoney(rule.amount, asset.converted_currency, { spaced: false, decimals: Number.isInteger(rule.amount) ? 0 : 2 })
  return (
    <RuleCard
      label={rule.end_date ? `${formatDay(rule.start_date)} - ${formatDay(rule.end_date)}` : formatDay(rule.start_date)}
      title={add ? 'Add' : 'Remove'}
      frequency={FREQUENCY_LABELS[rule.frequency]}
      amount={`${add ? '+' : '-'}${amount}`}
      tone={add ? 'positive' : 'negative'}
      status={!rule.is_active ? 'Paused' : next ? `Next Execution: ${formatDay(next)}` : 'Completed'}
      active={rule.is_active}
      onToggle={onToggle}
      onDelete={onDelete}
    />
  )
}
