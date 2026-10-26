import { CirclePlusIcon, Trash2Icon } from 'lucide-react'
import { DateField, todayIso } from '@/components/date-field'
import { FormField } from '@/components/form-field'
import { InfoDotIcon } from '@/components/icons'
import { NumberInput } from '@/components/number-input'
import { Button } from '@/components/ui/button'
import { InputGroup } from '@/components/ui/input-group'
import type { Lots } from './use-lots'

/**
 * The purchases of a stock or coin: quantity and acquisition date for each, a ruled divider with a 🗑 before every extra one
 * (it removes the purchase below it), then "Add More Quantity".
 */
export function LotFields({ lots, noun, decimals }: { lots: Lots; /** "stocks", "crypto" */ noun: string; decimals: number }) {
  return (
    <div className="flex flex-col gap-5">
      {lots.rows.map((lot, i) => (
        <div key={lot.key} className="flex animate-rise flex-col gap-5">
          {i > 0 && (
            <div className="relative flex items-center justify-center">
              <span aria-hidden className="absolute inset-x-0 top-1/2 border-t border-border" />
              <span className="relative bg-background px-2">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Remove this quantity"
                  onClick={() => lots.remove(lot.key)}
                  className="text-destructive hover:bg-destructive-subtle hover:text-destructive [&_svg]:size-3.5"
                >
                  <Trash2Icon />
                </Button>
              </span>
            </div>
          )}
          <FormField
            label="Quantity"
            htmlFor={`qty-${lot.key}`}
            required
            error={lot.error}
            hint={
              <p className="flex items-center gap-1 text-xs leading-5 text-muted-foreground">
                <InfoDotIcon />
                Quantity of {noun} acquired
              </p>
            }
          >
            <InputGroup invalid={!!lot.error}>
              <NumberInput
                id={`qty-${lot.key}`}
                value={lot.quantityText}
                onChange={(text) => lots.setQuantity(lot.key, text)}
                decimals={decimals}
                pad={false}
                placeholder="0"
                invalid={!!lot.error}
              />
            </InputGroup>
          </FormField>
          <FormField label="Acquisition Date" htmlFor={`date-${lot.key}`}>
            <DateField
              id={`date-${lot.key}`}
              value={lot.acquiredAt}
              onChange={(v) => lots.setAcquiredAt(lot.key, v)}
              max={todayIso()}
              withTime
            />
          </FormField>
        </div>
      ))}

      <Button variant="link" size="xs" onClick={lots.add} className="self-center">
        <CirclePlusIcon className="size-3.5" aria-hidden />
        Add More Quantity
      </Button>
    </div>
  )
}
