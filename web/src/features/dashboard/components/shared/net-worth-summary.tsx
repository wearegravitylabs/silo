// Pieces shared by the Total Net Worth card and its expanded modal.
import { TrendLine } from '@/components/trend-line'
import { formatMoney } from '@/lib/format'
import { PERIODS, type DashboardNetWorth, type DashboardPeriod } from '../../types'

/** Headline total with the change line beneath it. */
export function NetWorthTotal({ nw, period }: { nw: DashboardNetWorth; period: DashboardPeriod }) {
  // Amount first, else percentage; no line when the API sent neither.
  const delta = nw.change_amount ?? nw.change_pct
  const description = PERIODS.find((p) => p.label === period)?.description

  return (
    <div className="flex flex-col gap-2">
      <span className="font-heading text-[1.75rem] leading-9 font-bold tracking-[-0.0125rem] text-foreground">
        {formatMoney(nw.total, nw.currency)}
      </span>
      {delta != null && (
        <TrendLine
          delta={delta}
          amount={nw.change_amount != null && formatMoney(Math.abs(nw.change_amount), nw.currency, { spaced: false })}
          pct={nw.change_pct != null && `${Math.abs(Math.round(nw.change_pct))}%`}
          description={description}
        />
      )}
    </div>
  )
}
