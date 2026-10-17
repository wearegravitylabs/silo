import { useId, useState, type ReactNode } from 'react'
import { ChoiceCard } from '@/components/choice-card'
import { DateField } from '@/components/date-field'
import { FormField } from '@/components/form-field'
import { CalendarIcon } from '@/components/icons'
import { MoneyInput } from '@/components/money-input'
import { parseNumber } from '@/components/number-input'
import { PercentInput } from '@/components/percent-input'
import { SearchInput } from '@/components/search-input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { RuleOption, RuleOptions } from '../constants'
import type { Slot } from '../templates'

const THIS_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 51 }, (_, i) => String(THIS_YEAR + i))

/**
 * Fills one rule blank: a labelled field (Value, Time Frame, Year, Date, Duration, Category) or a searchable list of
 * cards (asset type, asset, debt). Save Changes reports the value once it's valid. Mount with `key` per opening.
 */
export function SlotDialog({
  slot,
  value,
  open,
  onOpenChange,
  onSave,
  currency,
  options,
}: {
  slot: Slot
  value: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (value: string) => void
  currency: string
  options: RuleOptions
}) {
  const [draft, setDraft] = useState(value)
  const result = validate(slot, draft)
  const save = () => {
    if (result == null) return
    onSave(result)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="sr-only">{slot.label ?? `Choose ${slot.placeholder}`}</DialogTitle>
        </DialogHeader>
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          {slot.editor === 'list' ? (
            <ChoiceList items={options[slot.source!]} value={draft} onChange={setDraft} label={slot.placeholder} />
          ) : (
            <DialogBody>
              <Field slot={slot} value={draft} onChange={setDraft} currency={currency} options={options} />
            </DialogBody>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" size="xs">
                Close
              </Button>
            </DialogClose>
            <Button type="submit" size="xs" disabled={result == null}>
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** The draft as the value to store, or null while it isn't valid yet. */
function validate(slot: Slot, draft: string): string | null {
  if (slot.editor === 'select' || slot.editor === 'list' || slot.editor === 'date') return draft || null
  const n = parseNumber(draft.replace(/^-/, ''))
  if (n == null) return null
  if (slot.editor === 'percent') return String(draft.startsWith('-') && slot.signed ? -n : n)
  if (slot.editor === 'money') return n > 0 ? String(n) : null
  return n > 0 && Number.isInteger(n) ? String(n) : null // number, year
}

/** The labelled control for a typed or dropdown blank. */
function Field({
  slot,
  value,
  onChange,
  currency,
  options,
}: {
  slot: Slot
  value: string
  onChange: (value: string) => void
  currency: string
  options: RuleOptions
}) {
  const id = useId()
  const label = slot.label ?? 'Value'
  // Built on demand: only the chosen editor renders (a dropdown needs its option list).
  const controls: Record<Exclude<Slot['editor'], 'list'>, () => ReactNode> = {
    percent: () => (
      // A signed rate keeps its minus: the field takes the size, the sign is typed in front.
      <PercentInput
        id={id}
        value={value.replace(/^-/, '')}
        onChange={(text) => onChange(value.startsWith('-') ? `-${text}` : text)}
        placeholder="0.00"
      />
    ),
    money: () => <MoneyInput id={id} value={value} onChange={onChange} currency={currency} placeholder="0.00" />,
    number: () => (
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        placeholder="0"
      />
    ),
    date: () => <DateField id={id} value={value} onChange={onChange} />,
    year: () => (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} icon={<CalendarIcon className="text-subtle" />}>
          <SelectValue placeholder="Select year" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {YEARS.map((y) => (
            <SelectItem key={y} value={y}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ),
    select: () => (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent className="max-h-65">
          {options[slot.source!].map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ),
  }

  return (
    <FormField label={label} htmlFor={id} required>
      {controls[slot.editor as Exclude<Slot['editor'], 'list'>]()}
    </FormField>
  )
}

/** Search pinned on top, the cards scrolling under it. Asset types use the compact card. */
function ChoiceList({
  items,
  value,
  onChange,
  label,
}: {
  items: RuleOption[]
  value: string
  onChange: (value: string) => void
  label: string
}) {
  const [search, setSearch] = useState('')
  const q = search.trim().toLowerCase()
  const shown = items.filter((o) => !q || `${o.label} ${o.description ?? ''}`.toLowerCase().includes(q))
  const compact = items.every((o) => !o.description)

  return (
    <div className="flex min-h-0 flex-col">
      <div className="shrink-0 px-5 pt-4 pb-4">
        <SearchInput value={search} onChange={setSearch} label={`Search ${label}`} placeholder="Search.." className="w-full bg-accent" />
      </div>
      <div role="radiogroup" aria-label={label} className="flex min-h-0 flex-col gap-4 overflow-y-auto px-5 pb-4">
        {shown.map((o) => (
          <ChoiceCard
            key={o.value}
            label={o.label}
            description={o.description}
            icon={o.icon}
            size={compact ? 'sm' : 'md'}
            selected={o.value === value}
            onSelect={() => onChange(o.value)}
          />
        ))}
        {shown.length === 0 && (
          <p className="py-6 text-center text-xs leading-5">{items.length ? 'No results' : 'Nothing to choose from yet'}</p>
        )}
      </div>
    </div>
  )
}
