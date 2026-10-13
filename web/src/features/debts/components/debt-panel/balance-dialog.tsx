import { useState } from 'react'
import { Callout } from '@/components/callout'
import { DateField, todayIso } from '@/components/date-field'
import { FormField } from '@/components/form-field'
import { MoneyInput } from '@/components/money-input'
import { parseNumber } from '@/components/number-input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatMoney } from '@/lib/format'
import { useDebtBalanceMutation } from '../../queries'
import type { Debt } from '../../types'

const COPY = {
  repayment: { title: 'Add History', submit: 'Add History', saving: 'Adding…' },
  adjust: { title: 'Update Balance', submit: 'Update Balance', saving: 'Updating…' },
}

/**
 * Amount + date for a debt's balance: `repayment` (Add History) takes the amount off the balance;
 * `adjust` (Update Balance) sets the balance to it. The form resets each time it opens.
 */
export function BalanceDialog({
  mode,
  debt,
  portfolioId,
  open,
  onOpenChange,
}: {
  mode: 'repayment' | 'adjust'
  debt: Debt
  portfolioId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" aria-describedby={undefined}>
        <BalanceForm mode={mode} debt={debt} portfolioId={portfolioId} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function BalanceForm({
  mode,
  debt,
  portfolioId,
  onDone,
}: {
  mode: 'repayment' | 'adjust'
  debt: Debt
  portfolioId: string
  onDone: () => void
}) {
  const [currency, setCurrency] = useState(debt.currency)
  const [amountText, setAmountText] = useState('')
  const [date, setDate] = useState(todayIso)
  const { mutate, isPending } = useDebtBalanceMutation(portfolioId, debt.id, mode)
  const copy = COPY[mode]

  const amount = parseNumber(amountText)
  const valid = amount !== null && amount > 0 && date !== ''

  const submit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (valid) mutate({ amount: amount!, date }, { onSuccess: onDone })
  }

  return (
    <form onSubmit={submit} className="contents" noValidate>
      <DialogHeader>
        <DialogTitle>{copy.title}</DialogTitle>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        {mode === 'repayment' ? (
          <p className="text-xs leading-5">Add a repayment for this debt</p>
        ) : (
          <Callout variant="notice" title={`Current Balance: ${formatMoney(debt.owned_balance, debt.currency)}`} />
        )}
        <FormField label="Amount" htmlFor="balance-amount" required>
          <MoneyInput id="balance-amount" value={amountText} onChange={setAmountText} currency={currency} onCurrencyChange={setCurrency} />
        </FormField>
        <FormField label="Date" htmlFor="balance-date" required>
          <DateField id="balance-date" value={date} onChange={setDate} />
        </FormField>
      </DialogBody>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary" size="xs">
            Close
          </Button>
        </DialogClose>
        <Button type="submit" size="xs" disabled={!valid} loading={isPending} loadingText={copy.saving}>
          {copy.submit}
        </Button>
      </DialogFooter>
    </form>
  )
}
