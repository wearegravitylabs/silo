import * as React from 'react'
import { InputGroupInput } from '@/components/ui/input-group'

/** The number in a NumberInput's text ("10,000.50" → 10000.5); null when empty or not a number. */
export function parseNumber(text: string): number | null {
  const clean = text.replace(/,/g, '').trim()
  if (clean === '' || clean === '.') return null
  const n = Number(clean)
  return Number.isFinite(n) ? n : null
}

/** "10000.5" → "10,000.50" (en-US, fixed decimals); `grouping: false` gives "10000.50". */
export function formatNumber(value: number, decimals = 2, grouping = true) {
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: grouping })
}

/**
 * Decimal text field for use inside an InputGroup. Controlled by its text, so a half-typed or out-of-range
 * value stays visible while the parent flags it. Typing allows digits, separators and one point (at most
 * `decimals` places); leaving the field tidies it to "10,000.00". Read the number with `parseNumber`.
 */
export function NumberInput({
  value,
  onChange,
  decimals = 2,
  grouping = true,
  pad = true,
  placeholder = '0.00',
  invalid,
  onBlur,
  ...props
}: Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type'> & {
  value: string
  onChange: (text: string) => void
  decimals?: number
  /** Thousands separators when tidied (money yes, percentages no) */
  grouping?: boolean
  /** Tidy to exactly `decimals` places ("10.00"); off keeps only the places typed, up to `decimals` ("0.0001") */
  pad?: boolean
  invalid?: boolean
}) {
  const sanitize = (raw: string) => {
    let text = raw.replace(/[^\d.,]/g, '')
    const point = text.indexOf('.')
    if (point !== -1) {
      const fraction = text
        .slice(point + 1)
        .replace(/[.,]/g, '')
        .slice(0, decimals)
      text = text.slice(0, point + 1) + fraction
    }
    return decimals === 0 ? text.replace('.', '') : text
  }

  return (
    <InputGroupInput
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={value}
      placeholder={placeholder}
      aria-invalid={invalid || undefined}
      onChange={(e) => onChange(sanitize(e.target.value))}
      onBlur={(e) => {
        const n = parseNumber(value)
        if (n !== null)
          onChange(
            pad
              ? formatNumber(n, decimals, grouping)
              : n.toLocaleString('en-US', { maximumFractionDigits: decimals, useGrouping: grouping }),
          )
        onBlur?.(e)
      }}
      {...props}
    />
  )
}
