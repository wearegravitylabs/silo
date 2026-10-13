import { useState } from 'react'
import { Navigation2Icon, PauseIcon, PencilIcon, PlayIcon, Trash2Icon } from 'lucide-react'
import { EntryAction, EntryCard } from '@/components/entry-card'
import { TabBody, TabCta, TabEmpty, TabListSkeleton } from '@/components/panel-layout'
import { Button } from '@/components/ui/button'
import { formatDay, formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { FREQUENCY_LABELS } from '../../constants'
import { addPeriods } from '../../payoff'
import { useDebtRuleMutations, useDebtRules } from '../../queries'
import type { Debt, DebtRule } from '../../types'
import { RuleDialog } from './rule-dialog'

/** Auto-Pilot tab: the debt's recurring rules (pause, edit, delete) and Add Rule. `adding` opens the dialog on arrival. */
export function AutopilotTab({ debt, portfolioId, adding = false }: { debt: Debt; portfolioId: string; adding?: boolean }) {
  const [dialog, setDialog] = useState<{ open: boolean; rule: DebtRule | null }>({ open: adding, rule: null })
  const { data: rules, isPending } = useDebtRules(portfolioId, debt.id)
  const { toggle, remove } = useDebtRuleMutations(portfolioId, debt.id)

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
              <RuleCard
                key={rule.id}
                rule={rule}
                currency={debt.currency}
                onToggle={() => toggle.mutate(rule)}
                onEdit={() => setDialog({ open: true, rule })}
                onDelete={() => remove.mutate(rule.id)}
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
    </div>
  )
}

/** The next day a rule runs: its start, or the first run from today on; null once it has ended. */
function nextRun(rule: DebtRule): string | null {
  const [y, m, d] = rule.start_date.split('-').map(Number)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let run = new Date(y, m - 1, d)
  for (let n = 1; run < today; n++) run = addPeriods(new Date(y, m - 1, d), rule.frequency, n)
  const iso = `${run.getFullYear()}-${String(run.getMonth() + 1).padStart(2, '0')}-${String(run.getDate()).padStart(2, '0')}`
  return rule.end_date && iso > rule.end_date ? null : iso
}

function RuleCard({
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
    <EntryCard
      className={cn(!rule.is_active && 'opacity-60')}
      label={rule.end_date ? `${formatDay(rule.start_date)} - ${formatDay(rule.end_date)}` : formatDay(rule.start_date)}
      actions={
        <>
          <EntryAction label={rule.is_active ? 'Pause rule' : 'Resume rule'} onClick={onToggle}>
            {rule.is_active ? <PauseIcon className="size-3.5" /> : <PlayIcon className="size-3.5" />}
          </EntryAction>
          <EntryAction label="Edit rule" onClick={onEdit}>
            <PencilIcon className="size-3.5" />
          </EntryAction>
          <EntryAction label="Delete rule" tone="danger" onClick={onDelete}>
            <Trash2Icon className="size-3.5" />
          </EntryAction>
        </>
      }
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium text-foreground">{payment ? 'Payment' : 'Add'}</span>
        <span className="text-foreground">{FREQUENCY_LABELS[rule.frequency]}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-xs leading-5">
        {/* Payments shrink the debt (green); additions grow it (red). */}
        <span className={payment ? 'text-success' : 'text-destructive'}>
          {payment ? '-' : '+'}
          {amount}
        </span>
        <span className="truncate text-muted-foreground">
          {!rule.is_active ? 'Paused' : next ? `Next Execution: ${formatDay(next)}` : 'Completed'}
        </span>
      </div>
    </EntryCard>
  )
}
