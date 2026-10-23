import { useState } from 'react'
import { CalendarIcon } from '@/components/icons'
import { Calendar } from '@/components/ui/calendar'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatClock } from '@/lib/format'
import { cn } from '@/lib/utils'

const SEP = ' / '

/** "2026-03-04" → "04 / 03 / 2026" */
const toText = (iso: string) => (iso ? iso.slice(0, 10).split('-').reverse().join(SEP) : '')

/** Typed digits → "DD / MM / YYYY" as far as they go. */
const mask = (digits: string) => [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join(SEP)

/** The ISO day for 8 typed digits (DDMMYYYY), or null when that day doesn't exist (31/02). */
function toIso(digits: string): string | null {
  if (digits.length !== 8) return null
  const [d, m, y] = [Number(digits.slice(0, 2)), Number(digits.slice(2, 4)), Number(digits.slice(4))]
  const date = new Date(y, m - 1, d)
  if (y < 1900 || date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null
  return `${digits.slice(4)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Today as YYYY-MM-DD in local time. */
export const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Day field typed as "DD / MM / YYYY" (slashes appear as you type), with a calendar button that opens a month grid
 * under the field. Reports an ISO day ("2026-03-04"), or '' while empty, incomplete or impossible. A complete but
 * impossible date (31 / 02) shows the error border by itself; `invalid` forces it.
 *
 * `withTime`: picking a day also stamps the current time ("01 / 02 / 2026 09:36 AM") and the value becomes a local
 * ISO datetime ("2026-02-01T09:36"). A typed date is midnight ("…T00:00"), shown without a time.
 */
export function DateField({
  id,
  value,
  onChange,
  invalid,
  min,
  max,
  disabled,
  withTime = false,
  className,
}: {
  id?: string
  value: string
  onChange: (iso: string) => void
  invalid?: boolean
  min?: string
  max?: string
  disabled?: boolean
  withTime?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(() => toText(value))
  // Follow outside changes (reset) without clobbering a half-typed date.
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    if (value) setText(toText(value))
  }

  const time = withTime && value.includes('T') ? value.slice(11, 16) : ''
  const shownTime = time && time !== '00:00' ? formatClock(time) : ''
  const display = shownTime ? `${text} ${shownTime}` : text
  const digits = text.replace(/\D/g, '')
  const impossible = digits.length === 8 && !toIso(digits)

  const report = (day: string, clock: string) => {
    const next = day && withTime ? `${day}T${clock || '00:00'}` : day
    setSeen(next)
    onChange(next)
  }

  const type = (raw: string) => {
    const next = raw.replace(/\D/g, '').slice(0, 8)
    const shrinking = raw.length < display.length && next === digits
    // Backspacing into the time drops the time first.
    if (shrinking && shownTime) return report(toIso(digits) ?? '', '')
    // Deleting a separator should delete the digit before it.
    const typed = shrinking ? next.slice(0, -1) : next
    setText(mask(typed))
    report(toIso(typed) ?? '', '')
  }

  const pick = (day: string) => {
    const now = new Date()
    setText(toText(day))
    report(day, withTime ? `${pad(now.getHours())}:${pad(now.getMinutes())}` : '')
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <InputGroup invalid={invalid || impossible} className={cn(open && !(invalid || impossible) && 'border-primary', className)}>
          <InputGroupInput
            id={id}
            value={display}
            onChange={(e) => type(e.target.value)}
            placeholder="DD / MM / YYYY"
            inputMode="numeric"
            autoComplete="off"
            disabled={disabled}
            aria-invalid={invalid || impossible || undefined}
          />
          <PopoverTrigger
            type="button"
            disabled={disabled}
            aria-label="Open calendar"
            className="mr-2 flex size-7 shrink-0 items-center justify-center rounded-md text-subtle transition-colors outline-none hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <CalendarIcon />
          </PopoverTrigger>
        </InputGroup>
      </PopoverAnchor>
      <PopoverContent align="center" sideOffset={6} className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <Calendar value={value.slice(0, 10)} onChange={pick} min={min} max={max} />
      </PopoverContent>
    </Popover>
  )
}
