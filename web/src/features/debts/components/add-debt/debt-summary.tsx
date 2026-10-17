import { Callout } from '@/components/callout'
import { SummaryList, type SummaryRow } from '@/components/summary-list'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/format'
import { DEBT_TYPE_OPTIONS, FREQUENCY_LABELS } from '../../constants'
import type { AddDebtForm } from './use-add-debt-form'

const EMPTY = '--'

/** Right pane of the Add Debt sheet: live summary, payoff projection, Add Debt. */
export function DebtSummary({ form, submitting, onSubmit }: { form: AddDebtForm; submitting?: boolean; onSubmit: () => void }) {
  const { values, derived } = form
  const money = (n: number | null) => formatMoney(n ?? 0, values.currency)

  const rows: SummaryRow[] = [
    { label: 'Debt Type', value: DEBT_TYPE_OPTIONS.find((o) => o.value === values.type)?.label ?? EMPTY },
    { label: 'Debt Name', value: values.name.trim() || EMPTY },
    { label: 'Current Balance', value: money(derived.balance), valueClassName: 'font-semibold' },
  ]
  if (values.hasSchedule) {
    rows.push(
      { label: 'Payment Amount', value: money(derived.payment) },
      { label: 'Frequency', value: FREQUENCY_LABELS[values.frequency] },
      { label: 'Interest Rate', value: `% ${derived.rate.toFixed(2)}` },
    )
  }

  const { payoff } = derived

  return (
    <>
      <SummaryList title="Debt Summary" rows={rows} />

      {payoff?.kind === 'date' && (
        <Callout title="Payoff Calculation">
          Based off the payment schedule, your expected payoff date is{' '}
          <span className="text-foreground">
            {payoff.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </Callout>
      )}
      {payoff?.kind === 'never' && (
        <Callout variant="error" title="Payoff Calculation">
          Payment amount is less than interest. Debt will never be paid off.
        </Callout>
      )}

      <Button onClick={onSubmit} disabled={!derived.canSubmit} loading={submitting} loadingText="Adding…" className="w-full">
        Add Debt
      </Button>
    </>
  )
}
