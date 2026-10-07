import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DashboardMover } from '../types'
import { CardHead } from './card-head'

export function MoversCard({
  title,
  icon,
  movers,
  currency,
  emptyMsg,
}: {
  title: string
  icon: ReactNode
  movers: DashboardMover[]
  currency: string
  emptyMsg: string
}) {
  return (
    <Card className="flex-1">
      <CardHead icon={icon} title={title} />
      {movers.length > 0 ? (
        <ul className="divide-y px-4 pb-2">
          {movers.map((m) => (
            <MoverRow key={m.asset_id} mover={m} currency={currency} />
          ))}
        </ul>
      ) : (
        <p className="flex h-30 items-center justify-center text-subtle">{emptyMsg}</p>
      )}
    </Card>
  )
}

function MoverRow({ mover, currency }: { mover: DashboardMover; currency: string }) {
  const up = (mover.change_pct ?? 0) >= 0
  return (
    <li className="flex h-16 items-center justify-between py-3">
      <div className="flex items-center gap-3">
        {mover.logo_url ? (
          <img src={mover.logo_url} alt="" className="size-9 rounded-full object-cover" />
        ) : (
          <span className="flex size-9 items-center justify-center rounded-full bg-accent font-semibold text-muted-foreground">
            {mover.name[0]?.toUpperCase()}
          </span>
        )}
        <div className="flex flex-col gap-0.5">
          <span className="leading-5.5 font-medium">{mover.name}</span>
          {mover.ticker && <span className="text-xs text-muted-foreground">{mover.ticker}</span>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="font-medium">{formatCurrency(mover.current_value, currency)}</span>
        {mover.change_pct != null && (
          <span className={cn('text-xs font-medium', up ? 'text-positive' : 'text-negative')}>
            {up ? '+' : ''}
            {mover.change_pct.toFixed(2)}%
          </span>
        )}
      </div>
    </li>
  )
}
