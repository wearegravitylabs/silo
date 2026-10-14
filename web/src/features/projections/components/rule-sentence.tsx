import { useState } from 'react'
import { DateField } from '@/components/date-field'
import { MoneyInput } from '@/components/money-input'
import { parseNumber } from '@/components/number-input'
import { SearchList } from '@/components/search-list'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { slotText, type RuleOptions } from '../constants'
import { RULE_TEMPLATES, type Part, type RuleTemplateId, type Slot } from '../templates'

/**
 * A rule template as a sentence: plain text with blue underlined blanks. Clicking a blank opens a small editor
 * (number, money, date or a list); applying it reports the new values. Used by the rules table and Add New Rule.
 */
export function RuleSentence({
  template,
  values,
  onChange,
  currency,
  options,
  highlightEmpty,
  className,
}: {
  template: RuleTemplateId
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
  currency: string
  options: RuleOptions
  /** Show unfilled blanks in red */
  highlightEmpty?: boolean
  className?: string
}) {
  return (
    <span className={className}>
      {(RULE_TEMPLATES[template].parts as Part[]).map((part, i) =>
        typeof part === 'string' ? (
          <span key={i}>{part}</span>
        ) : (
          <SlotButton
            key={part.key}
            slot={part}
            value={values[part.key] ?? ''}
            currency={currency}
            options={options}
            flagged={highlightEmpty && !values[part.key]}
            onApply={(value) => onChange({ ...values, [part.key]: value })}
          />
        ),
      )}
    </span>
  )
}

function SlotButton({
  slot,
  value,
  currency,
  options,
  flagged,
  onApply,
}: {
  slot: Slot
  value: string
  currency: string
  options: RuleOptions
  flagged?: boolean
  onApply: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const apply = (v: string) => {
    onApply(v)
    setOpen(false)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            'rounded-sm underline decoration-1 underline-offset-3 transition-[opacity,color] outline-none hover:opacity-75 focus-visible:ring-2 focus-visible:ring-ring/40',
            flagged ? 'text-destructive' : 'text-primary-dark',
          )}
        >
          {value ? slotText(slot, value, currency, options) : slot.placeholder}
        </PopoverTrigger>
        <PopoverContent className={cn('p-2', slot.kind === 'choice' ? 'w-56' : 'w-64')}>
          {slot.kind === 'choice' ? (
            <ChoiceEditor items={options[slot.source!]} value={value} onApply={apply} />
          ) : (
            <ValueEditor slot={slot} value={value} currency={currency} onApply={apply} />
          )}
        </PopoverContent>
      </Popover>
      {/* An empty blank keeps its suffix outside the link ("X% per year"); once filled it joins it */}
      {!value && slot.suffix}
    </>
  )
}

/** Short lists as plain options; long ones (assets) searchable. */
function ChoiceEditor({
  items,
  value,
  onApply,
}: {
  items: { value: string; label: string }[]
  value: string
  onApply: (v: string) => void
}) {
  if (items.length === 0) return <p className="px-2 py-1.5 text-xs leading-5">Nothing to choose from yet</p>
  if (items.length > 6)
    return (
      <SearchList
        items={items}
        getKey={(o) => o.value}
        matches={(o, q) => o.label.toLowerCase().includes(q)}
        selectedKey={value}
        onSelect={(o) => onApply(o.value)}
        renderItem={(o) => o.label}
      />
    )
  return (
    <div role="listbox" className="flex flex-col gap-0.5">
      {items.map((o) => (
        <button
          key={o.value}
          type="button"
          role="option"
          aria-selected={o.value === value}
          onClick={() => onApply(o.value)}
          className={cn(
            'rounded-lg px-2.5 py-1.5 text-left text-foreground outline-none first-letter:uppercase hover:bg-accent focus-visible:bg-accent',
            o.value === value && 'bg-accent',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const THIS_YEAR = new Date().getFullYear()

/** Typed blanks: percent, money, whole number, year or date, applied with Enter or Done once valid. */
function ValueEditor({ slot, value, currency, onApply }: { slot: Slot; value: string; currency: string; onApply: (v: string) => void }) {
  const [text, setText] = useState(value)
  const n = parseNumber(text)
  const result = {
    percent: n != null && (slot.signed || n >= 0) ? String(Number(text.replace(/,/g, ''))) : null,
    money: n != null && n > 0 ? String(n) : null,
    number: n != null && n > 0 && Number.isInteger(n) ? String(n) : null,
    year: n != null && n >= THIS_YEAR && n <= THIS_YEAR + 100 ? String(n) : null,
    date: text || null,
  }[slot.kind as Exclude<Slot['kind'], 'choice'>]

  // Digits and one point; a leading minus where the slot allows it.
  const numeric = (raw: string, decimals: number) => {
    const sign = slot.signed && raw.trim().startsWith('-') ? '-' : ''
    const [whole, ...rest] = raw.replace(/[^\d.]/g, '').split('.')
    return sign + whole + (decimals && rest.length ? `.${rest.join('').slice(0, decimals)}` : '')
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (result) onApply(result)
      }}
    >
      {slot.kind === 'money' ? (
        <MoneyInput value={text} onChange={setText} currency={currency} placeholder="0.00" />
      ) : slot.kind === 'date' ? (
        <DateField value={text} onChange={setText} />
      ) : (
        <InputGroup>
          {slot.kind === 'percent' && <InputGroupAddon aria-hidden>%</InputGroupAddon>}
          <InputGroupInput
            autoFocus
            inputMode={slot.kind === 'percent' ? 'decimal' : 'numeric'}
            value={text}
            onChange={(e) => setText(numeric(e.target.value, slot.kind === 'percent' ? 2 : 0))}
            placeholder={slot.kind === 'year' ? String(THIS_YEAR + 5) : '0'}
            aria-label={slot.placeholder}
            className={cn(slot.kind === 'percent' && 'pl-2')}
          />
        </InputGroup>
      )}
      <Button type="submit" size="xs" disabled={!result} className="self-end">
        Done
      </Button>
    </form>
  )
}
