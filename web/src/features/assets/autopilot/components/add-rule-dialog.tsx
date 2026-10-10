import { useState } from 'react'
import { DateInput } from '@/components/date-input'
import { FieldError } from '@/components/field-error'
import { FormField } from '@/components/form-field'
import { ChevronDownIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { getErrorMessage } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import type { AssetItem } from '../../types'
import { FREQ_LABELS } from '../constants'
import { useRuleMutations } from '../queries'

interface RuleForm {
  action: 'add' | 'remove'
  amountType: 'amount' | 'units'
  value: string
  frequency: string
  startDate: string
  endDate: string
}

const EMPTY: RuleForm = { action: 'add', amountType: 'units', value: '', frequency: 'weekly', startDate: '', endDate: '' }

/** Create an Auto-Pilot rule for one asset. The form resets each time it opens. */
export function AddRuleDialog({
  asset,
  portfolioId,
  open,
  onOpenChange,
}: {
  asset: AssetItem
  portfolioId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="w-110">
        <RuleFormBody asset={asset} portfolioId={portfolioId} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function RuleFormBody({ asset, portfolioId, onDone }: { asset: AssetItem; portfolioId: string; onDone: () => void }) {
  const [form, setForm] = useState<RuleForm>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const { create } = useRuleMutations(portfolioId)
  const set = (patch: Partial<RuleForm>) => setForm((f) => ({ ...f, ...patch }))

  const submit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const value = parseFloat(form.value)
    if (isNaN(value) || value <= 0) return setError('Enter a valid amount')
    if (!form.startDate) return setError('Start date is required')
    create.mutate(
      {
        target_id: asset.id,
        target_type: 'asset',
        action: form.action,
        ...(form.amountType === 'units' ? { units: value } : { amount: value }),
        frequency: form.frequency,
        start_date: new Date(form.startDate).toISOString(),
        ...(form.endDate ? { end_date: new Date(form.endDate).toISOString() } : {}),
      },
      { onSuccess: onDone, onError: (err) => setError(getErrorMessage(err, 'Failed to save rule')) },
    )
  }

  return (
    <form onSubmit={submit} className="contents" noValidate>
      <DialogHeader>
        <DialogTitle>Add Auto-Pilot Rule</DialogTitle>
      </DialogHeader>

      <DialogBody className="flex flex-col gap-4.5">
        <FormField label="Action" required>
          <div role="radiogroup" aria-label="Action" className="flex gap-0.5 bg-surface p-0.75">
            {(['add', 'remove'] as const).map((action) => (
              <button
                key={action}
                type="button"
                role="radio"
                aria-checked={form.action === action}
                onClick={() => set({ action })}
                className={cn(
                  'h-8.5 flex-1 rounded-lg font-semibold text-muted-foreground transition-all',
                  form.action === action && 'bg-background shadow-[0_1px_4px_rgb(0_0_0/0.08)]',
                  form.action === action && (action === 'add' ? 'text-positive' : 'text-destructive'),
                )}
              >
                {action === 'add' ? '+ Add' : '− Remove'}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Amount" htmlFor="rule-amount" required>
          <div className="flex gap-2">
            <Input
              id="rule-amount"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={form.value}
              onChange={(e) => set({ value: e.target.value })}
              placeholder={form.amountType === 'units' ? 'e.g. 10' : 'e.g. 500'}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="md"
              onClick={() => set({ amountType: form.amountType === 'units' ? 'amount' : 'units' })}
              aria-label={`Amount in ${form.amountType === 'units' ? 'units' : 'currency'} — switch`}
              className="gap-1 bg-accent px-3 text-xs text-foreground"
            >
              {form.amountType === 'units' && asset.ticker ? asset.ticker : '$'}
              <ChevronDownIcon className="size-2.5" />
            </Button>
          </div>
        </FormField>

        <FormField label="Frequency" htmlFor="rule-frequency" required>
          <div className="relative">
            <select
              id="rule-frequency"
              value={form.frequency}
              onChange={(e) => set({ frequency: e.target.value })}
              className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-border bg-surface px-4 pr-9 outline-none focus:border-primary"
            >
              {Object.entries(FREQ_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2" />
          </div>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start Date" htmlFor="rule-start" required>
            <DateInput id="rule-start" value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} />
          </FormField>
          <FormField label="End Date" htmlFor="rule-end">
            <DateInput id="rule-end" value={form.endDate} onChange={(e) => set({ endDate: e.target.value })} />
          </FormField>
        </div>

        {error && <FieldError message={error} />}
      </DialogBody>

      <DialogFooter>
        <Button
          variant="secondary"
          size="xs"
          onClick={() => {
            setForm(EMPTY)
            setError(null)
          }}
        >
          Clear
        </Button>
        <Button type="submit" size="xs" loading={create.isPending} loadingText="Saving…">
          Save Rule
        </Button>
      </DialogFooter>
    </form>
  )
}
