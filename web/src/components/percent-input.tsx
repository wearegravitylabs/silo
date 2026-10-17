import { NumberInput } from '@/components/number-input'
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group'

/** Percentage field: "% | 0.50". Controlled by text (see NumberInput); the parent decides what's valid. */
export function PercentInput({
  id,
  value,
  onChange,
  invalid,
  decimals = 2,
  placeholder,
  disabled,
  className,
}: {
  id?: string
  value: string
  onChange: (text: string) => void
  invalid?: boolean
  decimals?: number
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  return (
    <InputGroup invalid={invalid} className={className}>
      <InputGroupAddon aria-hidden>%</InputGroupAddon>
      <NumberInput
        id={id}
        value={value}
        onChange={onChange}
        invalid={invalid}
        decimals={decimals}
        grouping={false}
        placeholder={placeholder}
        disabled={disabled}
        className="pl-6"
      />
    </InputGroup>
  )
}
