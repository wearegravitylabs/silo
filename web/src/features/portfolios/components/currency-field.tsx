import { CurrencyFlag } from '@/components/currency-flag'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { currencyLabel } from '../lib'
import { useCurrencies } from '../queries'

/** Field-styled base-currency select: flag + "Naira (NGN)". */
export function CurrencyField({
  id,
  value,
  onChange,
  disabled,
  className,
}: {
  id?: string
  value: string
  onChange: (code: string) => void
  disabled?: boolean
  className?: string
}) {
  const { data: currencies = [], isLoading } = useCurrencies()
  const selected = currencies.find((c) => c.code === value)

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger id={id} className={className}>
        {/* Our own value text: the flag sits apart from the label, unlike in the list */}
        <span className="flex min-w-0 items-center gap-7">
          <CurrencyFlag code={value} />
          <span className="truncate">{selected ? currencyLabel(selected) : value}</span>
        </span>
      </SelectTrigger>
      <SelectContent>
        {currencies.map((c) => (
          <SelectItem key={c.code} value={c.code} icon={<CurrencyFlag code={c.code} />}>
            {currencyLabel(c)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
