import { CurrencyFlag, SUPPORTED_CURRENCIES } from '@/components/currency-flag'
import { ChevronDownIcon } from '@/components/icons'
import { NumberInput } from '@/components/number-input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group'
import { cn } from '@/lib/utils'

/**
 * Amount with a currency picker on the left: "🇺🇸 USD ⌄ | 10,000.00". Controlled by text (see NumberInput).
 * Leave out `onCurrencyChange` to show the currency without a menu.
 */
export function MoneyInput({
  id,
  value,
  onChange,
  currency,
  onCurrencyChange,
  currencies = SUPPORTED_CURRENCIES,
  invalid,
  placeholder,
  disabled,
  className,
}: {
  id?: string
  value: string
  onChange: (text: string) => void
  currency: string
  onCurrencyChange?: (currency: string) => void
  currencies?: string[]
  invalid?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  const label = (
    <>
      <CurrencyFlag code={currency} className="size-3.5" />
      <span>{currency}</span>
    </>
  )

  return (
    <InputGroup invalid={invalid} className={className}>
      <InputGroupAddon className="pl-3">
        {onCurrencyChange ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={disabled}
              aria-label={`Currency: ${currency}`}
              className="group flex h-7 items-center gap-1.5 rounded-md px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {label}
              <ChevronDownIcon className="size-2.5 text-muted-foreground transition-transform duration-200 group-aria-expanded:rotate-180" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-64 min-w-28 overflow-y-auto">
              {currencies.map((code) => (
                <DropdownMenuItem
                  key={code}
                  onSelect={() => onCurrencyChange(code)}
                  className={cn(code === currency && 'bg-accent')}
                  aria-checked={code === currency}
                  role="menuitemradio"
                >
                  <CurrencyFlag code={code} className="size-3.5" />
                  {code}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="flex items-center gap-1.5 px-1">{label}</span>
        )}
      </InputGroupAddon>
      <NumberInput
        id={id}
        value={value}
        onChange={onChange}
        invalid={invalid}
        placeholder={placeholder}
        disabled={disabled}
        className="pl-5"
      />
    </InputGroup>
  )
}
