import { useState } from 'react'
import { toast } from 'sonner'
import { FormField } from '@/components/form-field'
import { parseNumber } from '@/components/number-input'
import { ScheduleFields, useScheduleFields } from '@/components/schedule-fields'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { sameValues } from '@/hooks/use-form-draft'
import type { Frequency } from '@/lib/schedule'
import { useAssetRuleMutations } from '../../panel-queries'
import type { AssetItem, AssetRule } from '../../types'
import { AddRemoveToggle, AssetAmountInput } from './amount-fields'

const FREQUENCIES: Frequency[] = ['daily', 'weekly', 'monthly']

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
  const [amountText, setAmountText] = useState(
    rule
      ? rule.amount.toLocaleString('en-US', {
          minimumFractionDigits: asset.asset_type.startsWith('crypto') ? 2 : 0,
          maximumFractionDigits: 8,
        })
      : '',
  )
  const schedule = useScheduleFields(rule)
  const { save } = useAssetRuleMutations(portfolioId)

  const amount = parseNumber(amountText)
  const changed =
    !rule ||
    !sameValues(
      { action, amount, ...schedule.value },
      { action: rule.action, amount: rule.amount, frequency: rule.frequency, start_date: rule.start_date, end_date: rule.end_date },
    )
  const valid = amount !== null && amount > 0 && schedule.complete && changed

  const submit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!valid) return
    save.mutate(
      { assetId: asset.id, ruleId: rule?.id, action, amount: amount!, ...schedule.value },
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
          <AssetAmountInput id="rule-amount" asset={asset} value={amountText} onChange={setAmountText} />
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
          {rule ? 'Save Changes' : 'Add Rule'}
        </Button>
      </DialogFooter>
    </form>
  )
}
