import { FormField } from '@/components/form-field'
import { IconPicker } from '@/components/icon-picker'
import { MoneyInput } from '@/components/money-input'
import { PercentInput } from '@/components/percent-input'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { DEBT_ICON_OPTIONS, DEBT_TYPE_OPTIONS, FREQUENCY_LABELS } from '../../constants'
import type { DebtType, PaymentFrequency } from '../../types'
import type { AddDebtForm as AddDebtFormState } from './use-add-debt-form'

const FREQUENCIES = Object.entries(FREQUENCY_LABELS) as [PaymentFrequency, string][]

/** Left pane of the Add Debt sheet: icon, heading, then type, name, balance and the optional payment schedule. */
export function AddDebtForm({ form }: { form: AddDebtFormState }) {
  const { values, set, derived } = form

  return (
    <>
      <div className="flex flex-col items-center gap-3 text-center">
        <IconPicker
          value={values.icon}
          onChange={set.icon}
          options={DEBT_ICON_OPTIONS}
          label="Choose debt icon"
          discClassName="border-destructive-light bg-destructive-subtle"
          iconClassName="text-destructive"
          selectedClassName="bg-destructive-subtle"
        />
        <h2 className="mt-1 font-heading text-2xl leading-8 font-bold">Add Debt</h2>
        <p className="leading-5.5 text-muted-foreground">Add mortgage and other debts to your portfolio</p>
      </div>

      <div className="flex flex-col gap-5">
        <FormField label="Debt Type" htmlFor="debt-type" required>
          <Select value={values.type ?? ''} onValueChange={(v) => set.type(v as DebtType)}>
            <SelectTrigger id="debt-type">
              <SelectValue placeholder="Select debt type" />
            </SelectTrigger>
            <SelectContent>
              {DEBT_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Name" htmlFor="debt-name" required>
          <Input
            id="debt-name"
            value={values.name}
            onChange={(e) => set.name(e.target.value)}
            placeholder="Enter debt name"
            autoComplete="off"
          />
        </FormField>

        <FormField label="Current Balance" htmlFor="debt-balance" required>
          <MoneyInput
            id="debt-balance"
            value={values.balanceText}
            onChange={set.balanceText}
            currency={values.currency}
            onCurrencyChange={set.currency}
          />
        </FormField>

        <div className="flex gap-2">
          <Switch id="debt-schedule" checked={values.hasSchedule} onCheckedChange={set.hasSchedule} className="mt-0.75" />
          <div className="flex flex-col gap-1">
            <label htmlFor="debt-schedule" className="cursor-pointer font-medium">
              Payment Schedule
            </label>
            <p className="text-xs leading-5">Payment schedule determine how the repayment period and interests.</p>
          </div>
        </div>

        {values.hasSchedule && (
          <div className="flex animate-rise flex-col gap-5">
            <FormField label="Payment Amount" htmlFor="debt-payment" required>
              <MoneyInput
                id="debt-payment"
                value={values.paymentText}
                onChange={set.paymentText}
                currency={values.currency}
                onCurrencyChange={set.currency}
              />
            </FormField>

            <FormField label="Frequency" htmlFor="debt-frequency" required>
              <Select value={values.frequency} onValueChange={(v) => set.frequency(v as PaymentFrequency)}>
                <SelectTrigger id="debt-frequency">
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

            <FormField label="Interest Rate" htmlFor="debt-interest" error={derived.interestError}>
              <PercentInput id="debt-interest" value={values.interestText} onChange={set.interestText} invalid={!!derived.interestError} />
            </FormField>
          </div>
        )}
      </div>
    </>
  )
}
