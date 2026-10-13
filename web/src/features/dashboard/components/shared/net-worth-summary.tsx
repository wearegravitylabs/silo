// Pieces shared by the Total Net Worth card and its expanded modal.
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PERIODS, type DashboardNetWorth, type DashboardPeriod } from '../../types'

/** Change line styling per direction: green up, red down; all grey with no arrow when nothing moved. */
const TREND = {
  up: { tone: 'text-success', Icon: ArrowUpIcon, label: 'Up' },
  down: { tone: 'text-destructive', Icon: ArrowDownIcon, label: 'Down' },
  flat: { tone: 'text-muted-foreground', Icon: null, label: 'No change' },
}

/** Direction from the API's change (amount first, else percentage); null when the API has no change to show. */
function trendOf(amount: number | null, pct: number | null): keyof typeof TREND | null {
  const delta = amount ?? pct
  if (delta == null) return null
  return delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
}

/** Headline total with the change line beneath it. */
export function NetWorthTotal({ nw, period }: { nw: DashboardNetWorth; period: DashboardPeriod }) {
  const trend = trendOf(nw.change_amount, nw.change_pct)
  const description = PERIODS.find((p) => p.label === period)?.description

  return (
    <div className="flex flex-col gap-2">
      <span className="font-heading text-[1.75rem] leading-9 font-bold tracking-[-0.0125rem] text-foreground">
        {formatMoney(nw.total, nw.currency)}
      </span>
      {trend && <ChangeLine trend={trend} nw={nw} description={description} />}
    </div>
  )
}

/** "↑ ₦12,000.00 (12%) Past Month": amount and/or percentage, whichever the API sent. */
function ChangeLine({ trend, nw, description }: { trend: keyof typeof TREND; nw: DashboardNetWorth; description?: string }) {
  const { tone, Icon, label } = TREND[trend]
  const amount = nw.change_amount != null && formatMoney(Math.abs(nw.change_amount), nw.currency, { spaced: false })
  const pct = nw.change_pct != null && `${Math.abs(Math.round(nw.change_pct))}%`

  return (
    <p className="flex items-center gap-1.5 text-xs leading-5">
      <span className={cn('flex items-center gap-1', Icon && 'font-medium', tone)}>
        {Icon && <Icon className="size-3.5" aria-label={label} />}
        {amount}
        {amount && pct ? ` (${pct})` : pct}
      </span>
      {description}
    </p>
  )
}
