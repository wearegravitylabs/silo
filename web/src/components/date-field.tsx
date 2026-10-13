import { useRef, useState } from 'react'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'
import { cn } from '@/lib/utils'

const SEP = ' / '

/** "2026-03-04" → "04 / 03 / 2026" */
const toText = (iso: string) => (iso ? iso.split('-').reverse().join(SEP) : '')

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

/** Today as YYYY-MM-DD in local time. */
export const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Day field typed as "DD / MM / YYYY" (slashes appear as you type), with a calendar button that opens the
 * browser's date picker. Reports an ISO day ("2026-03-04"), or '' while empty, incomplete or impossible.
 * A complete but impossible date (31 / 02) shows the error border by itself; `invalid` forces it.
 */
export function DateField({
  id,
  value,
  onChange,
  invalid,
  min,
  max,
  disabled,
  className,
}: {
  id?: string
  value: string
  onChange: (iso: string) => void
  invalid?: boolean
  min?: string
  max?: string
  disabled?: boolean
  className?: string
}) {
  const picker = useRef<HTMLInputElement>(null)
  const [text, setText] = useState(() => toText(value))
  // Follow outside changes (picker, reset) without clobbering a half-typed date.
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    if (value) setText(toText(value))
  }

  const digits = text.replace(/\D/g, '')
  const impossible = digits.length === 8 && !toIso(digits)

  const type = (raw: string) => {
    // Deleting a separator should delete the digit before it.
    const next = raw.replace(/\D/g, '').slice(0, 8)
    const shrunk = raw.length < text.length && next === digits ? next.slice(0, -1) : next
    setText(mask(shrunk))
    const iso = toIso(shrunk) ?? ''
    setSeen(iso)
    onChange(iso)
  }

  const openPicker = () => {
    const input = picker.current
    if (!input) return
    try {
      input.showPicker()
    } catch {
      input.focus()
    }
  }

  return (
    <InputGroup invalid={invalid || impossible} className={cn('relative', className)}>
      <InputGroupInput
        id={id}
        value={text}
        onChange={(e) => type(e.target.value)}
        placeholder="DD / MM / YYYY"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        aria-invalid={invalid || impossible || undefined}
      />
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        aria-label="Open calendar"
        className="mr-2 flex size-7 shrink-0 items-center justify-center rounded-md text-subtle transition-colors outline-none hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-3.5">
          <path
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5 1.5a.75.75 0 0 1 .75.75V3h4.5V2.25a.75.75 0 0 1 1.5 0V3H13A1.5 1.5 0 0 1 14.5 4.5v9A1.5 1.5 0 0 1 13 15H3A1.5 1.5 0 0 1 1.5 13.5v-9A1.5 1.5 0 0 1 3 3h1.25V2.25A.75.75 0 0 1 5 1.5ZM3 6v7.5h10V6H3Z"
          />
        </svg>
      </button>
      {/* The native picker, anchored under the calendar button; never shown itself. */}
      <input
        ref={picker}
        type="date"
        tabIndex={-1}
        aria-hidden
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          setText(toText(e.target.value))
          setSeen(e.target.value)
          onChange(e.target.value)
        }}
        className="pointer-events-none absolute right-2 bottom-0 h-0 w-7 opacity-0"
      />
    </InputGroup>
  )
}
