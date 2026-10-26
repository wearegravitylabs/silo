import { useEffect, useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTHS = Array.from({ length: 12 }, (_, m) => new Date(2000, m, 1).toLocaleDateString('en-US', { month: 'short' }))

const pad = (n: number) => String(n).padStart(2, '0')
/** Local Date → "YYYY-MM-DD" */
const toDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
/** "YYYY-MM-DD" → local Date (midnight), or null */
const fromDay = (day: string | undefined) => {
  if (!day) return null
  const [y, m, d] = day.slice(0, 10).split('-').map(Number)
  return y && m && d ? new Date(y, m - 1, d) : null
}

// Shared look for the ‹ › buttons and the month/year pickers: small white controls with the button shadow.
const control = 'h-8 rounded-lg border-0 bg-background shadow-small text-xs font-medium text-foreground'

/**
 * Month grid (Mo–Su) for picking one day: ‹ month ⌄ year ⌄ › on top, the neighbouring months' days greyed out.
 * Days outside `min`/`max` are greyed and can't be picked (e.g. no future dates with `max` = today).
 * Arrow keys move between days, Enter or Space picks. Values are local "YYYY-MM-DD" days.
 */
export function Calendar({
  value,
  onChange,
  min,
  max,
  className,
}: {
  value: string
  onChange: (day: string) => void
  min?: string
  max?: string
  className?: string
}) {
  const selected = fromDay(value)
  const minDate = fromDay(min)
  const maxDate = fromDay(max)
  const today = new Date()
  const start = selected ?? (maxDate && maxDate < today ? maxDate : today)

  const [view, setView] = useState({ year: start.getFullYear(), month: start.getMonth() })
  const [focusDay, setFocusDay] = useState(toDay(start))
  const grid = useRef<HTMLDivElement>(null)
  const moved = useRef(false) // only steal focus after an arrow key, not on open

  useEffect(() => {
    if (!moved.current) return
    grid.current?.querySelector<HTMLButtonElement>(`[data-day="${focusDay}"]`)?.focus()
  }, [focusDay, view])

  const disabled = (d: Date) => (!!minDate && d < minDate) || (!!maxDate && d > maxDate)
  const showMonth = (year: number, month: number) => {
    const d = new Date(year, month, 1)
    setView({ year: d.getFullYear(), month: d.getMonth() })
  }

  // Monday-first weeks covering the month: 5 or 6 rows.
  const first = new Date(view.year, view.month, 1)
  const lead = (first.getDay() + 6) % 7
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const cells = Array.from({ length: Math.ceil((lead + daysInMonth) / 7) * 7 }, (_, i) => new Date(view.year, view.month, i - lead + 1))

  // The one day Tab lands on: the focused day when it's in view, else the month's first pickable day.
  const inView = cells.some((d) => toDay(d) === focusDay && d.getMonth() === view.month)
  const tabDay = inView ? focusDay : toDay(cells.find((d) => d.getMonth() === view.month && !disabled(d)) ?? first)

  const minYear = minDate?.getFullYear() ?? 1950
  const maxYear = maxDate?.getFullYear() ?? today.getFullYear() + 10
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i)
  const canPrev = !minDate || new Date(view.year, view.month, 0) >= minDate
  const canNext = !maxDate || new Date(view.year, view.month + 1, 1) <= maxDate

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]
    if (!step) return
    e.preventDefault()
    const current = fromDay(tabDay) ?? start
    const next = new Date(current.getFullYear(), current.getMonth(), current.getDate() + step)
    if (disabled(next)) return
    moved.current = true
    setFocusDay(toDay(next))
    if (next.getMonth() !== view.month || next.getFullYear() !== view.year) showMonth(next.getFullYear(), next.getMonth())
  }

  return (
    <div className={cn('flex w-68 flex-col gap-3 p-2.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Previous month"
          disabled={!canPrev}
          onClick={() => showMonth(view.year, view.month - 1)}
          className={cn(control, 'flex size-8 items-center justify-center outline-none hover:bg-accent disabled:opacity-40')}
        >
          <ChevronLeftIcon className="size-3.5 text-muted-foreground" />
        </button>
        <div className="flex">
          <Select value={String(view.month)} onValueChange={(m) => showMonth(view.year, Number(m))}>
            <SelectTrigger aria-label="Month" className={cn(control, 'w-auto gap-1.5 rounded-r-none px-2.5')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60 min-w-20">
              {MONTHS.map((label, m) => (
                <SelectItem key={label} value={String(m)} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(view.year)} onValueChange={(y) => showMonth(Number(y), view.month)}>
            <SelectTrigger aria-label="Year" className={cn(control, 'w-auto gap-1.5 rounded-l-none px-2.5')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60 min-w-20">
              {years.map((y) => (
                <SelectItem key={y} value={String(y)} className="text-xs">
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <button
          type="button"
          aria-label="Next month"
          disabled={!canNext}
          onClick={() => showMonth(view.year, view.month + 1)}
          className={cn(control, 'flex size-8 items-center justify-center outline-none hover:bg-accent disabled:opacity-40')}
        >
          <ChevronRightIcon className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      <div ref={grid} role="grid" aria-label={`${MONTHS[view.month]} ${view.year}`} onKeyDown={onKeyDown} className="grid grid-cols-7">
        {WEEKDAYS.map((d) => (
          <span key={d} role="columnheader" className="flex h-8 items-center justify-center text-xs text-muted-foreground">
            {d}
          </span>
        ))}
        {cells.map((d) => {
          const day = toDay(d)
          const outside = d.getMonth() !== view.month
          const off = disabled(d)
          const isSelected = day === value?.slice(0, 10)
          return (
            <button
              key={day}
              type="button"
              role="gridcell"
              data-day={day}
              aria-selected={isSelected}
              aria-label={d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              disabled={off}
              tabIndex={day === tabDay && !outside ? 0 : -1}
              onClick={() => onChange(day)}
              className={cn(
                'flex size-9 items-center justify-center rounded-lg leading-5.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                isSelected ? 'bg-primary-dark font-medium text-white' : outside || off ? 'text-subtle' : 'text-foreground hover:bg-accent',
                off && 'cursor-default',
              )}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
