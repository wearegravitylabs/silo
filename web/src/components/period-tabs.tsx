import { CHART_PERIODS, type ChartPeriod } from '@/lib/periods'
import { cn } from '@/lib/utils'

/** 1D · 1M · 3M · YTD · 1Y · All, under a chart. The selected period gets a grey pill. */
export function PeriodTabs({
  value,
  onChange,
  periods = CHART_PERIODS.map((p) => p.label),
  className,
}: {
  value: ChartPeriod
  onChange: (period: ChartPeriod) => void
  periods?: readonly ChartPeriod[]
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-center gap-1', className)} role="group" aria-label="Chart period">
      {periods.map((label) => (
        <button
          key={label}
          type="button"
          aria-pressed={label === value}
          onClick={() => onChange(label)}
          className="h-6 min-w-8 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-accent aria-pressed:font-semibold aria-pressed:text-foreground"
        >
          {label}
        </button>
      ))}
    </div>
  )
}
