import { useState } from 'react'
import { FormField } from '@/components/form-field'
import { MoneyInput } from '@/components/money-input'
import { formatNumber, parseNumber } from '@/components/number-input'
import { ScheduleFields, useScheduleFields } from '@/components/schedule-fields'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FREQUENCY_LABELS } from '../../constants'
import { useDebtRuleMutations } from '../../queries'
import type { Debt, DebtRule, PaymentFrequency } from '../../types'

const FREQUENCIES = Object.keys(FREQUENCY_LABELS) as PaymentFrequency[]
export { END_BEFORE_START } from '@/components/schedule-fields'

/** Add an Auto-Pilot repayment rule to a debt, or edit one (`rule`). The form resets each time it opens. */
export function RuleDialog({
  debt,
  rule,
  portfolioId,
  open,
  onOpenChange,
}: {
  debt: Debt
  rule: DebtRule | null
  portfolioId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" aria-describedby={undefined}>
        <RuleForm key={rule?.id ?? 'new'} debt={debt} rule={rule} portfolioId={portfolioId} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function RuleForm({ debt, rule, portfolioId, onDone }: { debt: Debt; rule: DebtRule | null; portfolioId: string; onDone: () => void }) {
  const [currency, setCurrency] = useState(debt.currency)
  const [amountText, setAmountText] = useState(rule ? formatNumber(rule.amount) : '')
  const schedule = useScheduleFields(rule)
  const { save } = useDebtRuleMutations(portfolioId, debt.id)

  const amount = parseNumber(amountText)
  const valid = amount !== null && amount > 0 && schedule.complete

  const submit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!valid) return
    save.mutate({ ruleId: rule?.id, amount: amount!, ...schedule.value }, { onSuccess: onDone })
  }

  return (
    <form onSubmit={submit} className="contents" noValidate>
      <DialogHeader>
        <DialogTitle>{rule ? 'Edit Auto-Pilot Rule' : 'Add Auto-Pilot Rule'}</DialogTitle>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        <p className="text-xs leading-5">Automate repayment for this debt</p>
        <FormField label="Amount" htmlFor="rule-amount" required>
          <MoneyInput id="rule-amount" value={amountText} onChange={setAmountText} currency={currency} onCurrencyChange={setCurrency} />
        </FormField>
        <ScheduleFields fields={schedule} frequencies={FREQUENCIES} />
      </DialogBody>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary" size="xs">
            Close
          </Button>
        </DialogClose>
        <Button type="submit" size="xs" disabled={!valid} loading={save.isPending} loadingText="Saving…">
          {rule ? 'Save Rule' : 'Add Rule'}
        </Button>
      </DialogFooter>
    </form>
  )
}
