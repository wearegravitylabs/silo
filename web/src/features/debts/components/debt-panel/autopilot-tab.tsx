import { useState } from 'react'
import { Navigation2Icon } from 'lucide-react'
import { TabBody, TabCta, TabEmpty, TabListSkeleton } from '@/components/panel-layout'
import { RuleCard } from '@/components/rule-card'
import { useRuleConfirm } from '@/components/rule-confirm-dialog'
import { Button } from '@/components/ui/button'
import { formatDay, formatMoney } from '@/lib/format'
import { nextRun } from '@/lib/schedule'
import { FREQUENCY_LABELS } from '../../constants'
import { useDebtRuleMutations, useDebtRules } from '../../queries'
import type { Debt, DebtRule } from '../../types'
import { RuleDialog } from './rule-dialog'

/** Auto-Pilot tab: the debt's recurring rules (⋯ pause or resume, edit, delete — each confirmed) and Add Rule. `adding` opens the dialog on arrival. */
export function AutopilotTab({ debt, portfolioId, adding = false }: { debt: Debt; portfolioId: string; adding?: boolean }) {
  const [dialog, setDialog] = useState<{ open: boolean; rule: DebtRule | null }>({ open: adding, rule: null })
  const { data: rules, isPending } = useDebtRules(portfolioId, debt.id)
  const { toggle, remove } = useDebtRuleMutations(portfolioId, debt.id)
  const confirm = useRuleConfirm<DebtRule>({
    toggle: (rule, done) => toggle.mutate(rule, { onSuccess: done }),
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
            body="Automate payment to this debt. Once an Auto-Pilot Rule is added, it will appear here"
            bodyClassName="max-w-64"
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {rules.map((rule) => (
              <DebtRuleCard
                key={rule.id}
                rule={rule}
                currency={debt.currency}
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
        debt={debt}
        rule={dialog.rule}
        portfolioId={portfolioId}
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
      {confirm.dialog}
    </div>
  )
}

/** Payments shrink the debt (green); additions grow it (red). */
function DebtRuleCard({
  rule,
  currency,
  onToggle,
  onEdit,
  onDelete,
}: {
  rule: DebtRule
  currency: string
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const next = nextRun(rule)
  const payment = rule.action === 'payment'
  const amount = formatMoney(rule.amount, currency, { spaced: false, decimals: Number.isInteger(rule.amount) ? 0 : 2 })
  return (
    <RuleCard
      label={rule.end_date ? `${formatDay(rule.start_date)} - ${formatDay(rule.end_date)}` : formatDay(rule.start_date)}
      title={payment ? 'Payment' : 'Add'}
      frequency={FREQUENCY_LABELS[rule.frequency]}
      amount={`${payment ? '-' : '+'}${amount}`}
      tone={payment ? 'positive' : 'negative'}
      status={next ? `Next Execution: ${formatDay(next)}` : 'Completed'}
      active={rule.is_active}
      onToggle={onToggle}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}
