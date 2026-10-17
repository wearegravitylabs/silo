import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Styling per direction: green up, red down; all grey with no arrow when nothing moved. */
const TREND = {
  up: { tone: 'text-success', Icon: ArrowUpIcon, label: 'Up' },
  down: { tone: 'text-destructive', Icon: ArrowDownIcon, label: 'Down' },
  flat: { tone: 'text-muted-foreground', Icon: null, label: 'No change' },
}

/**
 * "↑ $12,000.00 (12%) Past Month". `delta` picks the direction; `amount` and `pct` arrive formatted (either may be
 * missing). `description` trails in the default text colour.
 */
export function TrendLine({
  delta,
  amount,
  pct,
  description,
  className,
}: {
  delta: number
  amount?: string | false
  pct?: string | false
  description?: string
  className?: string
}) {
  const { tone, Icon, label } = TREND[delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat']

  return (
    <p className={cn('flex items-center gap-1.5 text-xs leading-5', className)}>
      <span className={cn('flex items-center gap-1', Icon && 'font-medium', tone)}>
        {Icon && <Icon className="size-3.5" aria-label={label} />}
        {amount}
        {amount && pct ? ` (${pct})` : pct}
      </span>
      {description}
    </p>
  )
}
