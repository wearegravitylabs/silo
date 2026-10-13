import { useState } from 'react'
import { DateField } from '@/components/date-field'
import { FormField } from '@/components/form-field'
import { MoneyInput } from '@/components/money-input'
import { formatNumber, parseNumber } from '@/components/number-input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FREQUENCY_LABELS } from '../../constants'
import { useDebtRuleMutations } from '../../queries'
import type { Debt, DebtRule, PaymentFrequency } from '../../types'

const FREQUENCIES = Object.entries(FREQUENCY_LABELS) as [PaymentFrequency, string][]
export const END_BEFORE_START = 'End date must be after the start date'

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
  const [frequency, setFrequency] = useState<PaymentFrequency>(rule?.frequency ?? 'weekly')
  const [start, setStart] = useState(rule?.start_date ?? '')
  const [end, setEnd] = useState(rule?.end_date ?? '')
  const { save } = useDebtRuleMutations(portfolioId, debt.id)

  const amount = parseNumber(amountText)
  const endError = end && start && end < start ? END_BEFORE_START : undefined
  const valid = amount !== null && amount > 0 && start !== '' && !endError

  const submit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!valid) return
    save.mutate({ ruleId: rule?.id, amount: amount!, frequency, start_date: start, end_date: end || null }, { onSuccess: onDone })
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
        <FormField label="Frequency" htmlFor="rule-frequency" required>
          <Select value={frequency} onValueChange={(v) => setFrequency(v as PaymentFrequency)}>
            <SelectTrigger id="rule-frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Start Date" htmlFor="rule-start" required>
          <DateField id="rule-start" value={start} onChange={setStart} />
        </FormField>
        <FormField label="End Date" htmlFor="rule-end" error={endError}>
          <DateField id="rule-end" value={end} onChange={setEnd} min={start || undefined} invalid={!!endError} />
        </FormField>
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
