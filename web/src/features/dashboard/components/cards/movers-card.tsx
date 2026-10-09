import { useState } from 'react'
import { ArrowDownIcon, ArrowUpIcon, ChartCandlestickIcon } from 'lucide-react'
import { ChevronDownIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { MOVER_WINDOWS, type DashboardMover, type MoverWindow } from '../../types'
import { CardHead } from '../shared/card-head'
import { PlaceholderRow } from '../shared/placeholder-row'

const ROWS = 3

/** Top gainers or losers, with a time-window picker. Empty: three grey placeholder rows. */
export function MoversCard({ kind, movers }: { kind: 'gainers' | 'losers'; movers: DashboardMover[] }) {
  // TODO: the window is UI-only until the dashboard API accepts it.
  const [moverWindow, setMoverWindow] = useState<MoverWindow>('Today')

  return (
    <Card className="min-w-0 flex-1">
      <CardHead
        icon={<ChartCandlestickIcon className={cn('size-4', kind === 'gainers' ? 'text-success' : 'text-destructive')} />}
        title={kind === 'gainers' ? 'Top Gainers' : 'Top Losers'}
        bordered={false}
        right={<WindowPicker value={moverWindow} onChange={setMoverWindow} />}
      />
      <ul className="flex flex-col divide-y divide-border px-4 pb-1">
        {movers.length > 0
          ? movers.slice(0, ROWS).map((m) => <MoverRow key={m.asset_id} mover={m} />)
          : Array.from({ length: ROWS }, (_, i) => <PlaceholderRow key={i} />)}
      </ul>
    </Card>
  )
}

function WindowPicker({ value, onChange }: { value: MoverWindow; onChange: (w: MoverWindow) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="xs" className="gap-1 shadow-elevated">
          {value}
          <ChevronDownIcon className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {MOVER_WINDOWS.map((w) => (
          <DropdownMenuItem key={w} onSelect={() => onChange(w)} className={cn(w === value && 'bg-accent')}>
            {w}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MoverRow({ mover }: { mover: DashboardMover }) {
  const up = (mover.change_amount ?? 0) >= 0
  return (
    <li className="flex items-center justify-between gap-3 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-background shadow-small">
          {mover.logo_url ? (
            <img src={mover.logo_url} alt="" className="size-6 object-contain" />
          ) : (
            <span className="text-xs font-semibold text-muted-foreground">{(mover.ticker || mover.name).slice(0, 2).toUpperCase()}</span>
          )}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate leading-5.5 font-medium text-foreground">{mover.name}</span>
          {mover.ticker && <span className="text-xs leading-4 text-muted-foreground uppercase">{mover.ticker}</span>}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="leading-5.5 font-medium text-foreground">
          {formatMoney(mover.current_value, mover.currency, { spaced: false })}
        </span>
        {mover.change_amount != null && (
          <span className={cn('flex items-center gap-1 text-xs leading-4', up ? 'text-positive' : 'text-negative')}>
            {up ? <ArrowUpIcon className="size-3" aria-hidden /> : <ArrowDownIcon className="size-3" aria-hidden />}
            {formatMoney(Math.abs(mover.change_amount), mover.currency, { spaced: false })}
            {mover.change_pct != null && ` (${Number(Math.abs(mover.change_pct).toFixed(2))}%)`}
          </span>
        )}
      </div>
    </li>
  )
}
