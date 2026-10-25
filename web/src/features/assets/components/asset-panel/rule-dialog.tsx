import { useState } from 'react'
import { toast } from 'sonner'
import { DateField } from '@/components/date-field'
import { FormField } from '@/components/form-field'
import { parseNumber } from '@/components/number-input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FREQUENCY_LABELS, type Frequency } from '@/lib/schedule'
import { useAssetRuleMutations } from '../../panel-queries'
import type { AssetItem, AssetRule } from '../../types'
import { AddRemoveToggle, AssetAmountInput } from './amount-fields'

const FREQUENCIES: Frequency[] = ['daily', 'weekly', 'monthly']
const END_BEFORE_START = 'End date must be after the start date'

/**
 * Add an Auto-Pilot rule to an asset, or edit one (`rule`): add or remove, how much each run (units, or money), how
 * often, from when and until when (optional). Save Changes needs a change. The form resets each time it opens.
 */
export function RuleDialog({
  asset,
  rule,
  portfolioId,
  open,
  onOpenChange,
}: {
  asset: AssetItem
  rule: AssetRule | null
  portfolioId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        {open && <RuleForm asset={asset} rule={rule} portfolioId={portfolioId} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function RuleForm({
  asset,
  rule,
  portfolioId,
  onDone,
}: {
  asset: AssetItem
  rule: AssetRule | null
  portfolioId: string
  onDone: () => void
}) {
  const [action, setAction] = useState<AssetRule['action']>(rule?.action ?? 'add')
  const [amountText, setAmountText] = useState(rule ? rule.amount.toLocaleString('en-US', { maximumFractionDigits: 8 }) : '')
  const [frequency, setFrequency] = useState<Frequency>(rule?.frequency ?? 'weekly')
  const [start, setStart] = useState(rule?.start_date ?? '')
  const [end, setEnd] = useState(rule?.end_date ?? '')
  const { save } = useAssetRuleMutations(portfolioId)

  const amount = parseNumber(amountText)
  const endError = end && start && end < start ? END_BEFORE_START : undefined
  const changed =
    !rule ||
    action !== rule.action ||
    amount !== rule.amount ||
    frequency !== rule.frequency ||
    start !== rule.start_date ||
    (end || null) !== rule.end_date
  const valid = amount !== null && amount > 0 && start !== '' && !endError && changed

  const submit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!valid) return
    save.mutate(
      { assetId: asset.id, ruleId: rule?.id, action, amount: amount!, frequency, start_date: start, end_date: end || null },
      {
        onSuccess: () => {
          onDone()
          toast.success(rule ? 'Rule has been updated successfully!' : 'Rule has been added successfully!')
        },
        onError: () => toast.error('Something went wrong. Please try again.'),
      },
    )
  }

  return (
    <form onSubmit={submit} className="contents" noValidate>
      <DialogHeader>
        <DialogTitle className="font-sans">{rule ? 'Edit Auto-Pilot Rule' : 'Add Auto-Pilot Rule'}</DialogTitle>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        <AddRemoveToggle value={action} onChange={setAction} />
        <FormField label="Amount" htmlFor="rule-amount" required>
          <AssetAmountInput id="rule-amount" asset={asset} value={amountText} onChange={setAmountText} placeholder="0" />
        </FormField>
        <FormField label="Frequency" htmlFor="rule-frequency" required>
          <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
            <SelectTrigger id="rule-frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((f) => (
                <SelectItem key={f} value={f}>
                  {FREQUENCY_LABELS[f]}
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
          {rule ? 'Save Changes' : 'Add Rule'}
        </Button>
      </DialogFooter>
    </form>
  )
}
