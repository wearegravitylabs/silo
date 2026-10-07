import { DateInput } from '@/components/date-input'
import { FormField } from '@/components/form-field'
import { CloseIcon, PlusCircleIcon } from '@/components/icons'
import { Input } from '@/components/ui/input'
import type { Lot } from './types'

export const isValidLot = (l: Lot) => l.quantity !== '' && parseFloat(l.quantity) > 0 && l.date !== ''

/** Editable list of purchase lots (quantity + acquisition date). The first lot can't be removed. */
export function LotFields({ lots, onChange }: { lots: Lot[]; onChange: (lots: Lot[]) => void }) {
  const update = (i: number, patch: Partial<Lot>) => onChange(lots.map((l, j) => (j === i ? { ...l, ...patch } : l)))

  return (
    <div className="flex flex-col gap-4">
      {lots.map((lot, i) => (
        <fieldset key={i} className="flex flex-col gap-3">
          {i > 0 && (
            <legend className="flex w-full items-center justify-between pt-1">
              <span className="text-xs font-medium text-muted-foreground">Lot {i + 1}</span>
              <button
                type="button"
                aria-label={`Remove lot ${i + 1}`}
                onClick={() => onChange(lots.filter((_, j) => j !== i))}
                className="flex"
              >
                <CloseIcon className="size-3.5 text-subtle" />
              </button>
            </legend>
          )}
          <FormField
            label="Quantity"
            htmlFor={`lot-${i}-qty`}
            required
            hint={<p className="text-xs leading-5 text-muted-foreground">Number of shares you hold for this position</p>}
          >
            <Input
              id={`lot-${i}-qty`}
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={lot.quantity}
              onChange={(e) => update(i, { quantity: e.target.value })}
              placeholder="0"
            />
          </FormField>
          <FormField label="Acquisition Date" htmlFor={`lot-${i}-date`} required>
            <DateInput id={`lot-${i}-date`} value={lot.date} onChange={(e) => update(i, { date: e.target.value })} />
          </FormField>
        </fieldset>
      ))}

      <button
        type="button"
        onClick={() => onChange([...lots, { quantity: '', date: '' }])}
        className="flex h-7 items-center gap-1.5 self-start rounded-md border border-line px-2.5 text-xs font-semibold text-primary-dark transition-opacity hover:opacity-80"
      >
        <PlusCircleIcon className="size-3.25" />
        Add another lot
      </button>
    </div>
  )
}
