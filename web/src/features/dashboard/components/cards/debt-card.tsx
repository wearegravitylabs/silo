import { useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { CarIcon, GraduationCapIcon, HandCoinsIcon, HouseIcon } from 'lucide-react'
import { AiSparkleIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DashboardDebt, DashboardResponse } from '../../types'
import { CardHead } from '../shared/card-head'
import { PlaceholderRow } from '../shared/placeholder-row'

const DEBT_ICON: Record<string, typeof HouseIcon> = {
  student_loan: GraduationCapIcon,
  mortgage: HouseIcon,
  auto_loan: CarIcon,
}

/** Total debt, split into scheduled (has a repayment plan) and unscheduled columns. */
export function DebtCard({ portfolioId, debts }: { portfolioId: string; debts: DashboardResponse['debts'] }) {
  const { summary, items } = debts
  const scheduled = items.filter((d) => d.scheduled)
  const unscheduled = items.filter((d) => !d.scheduled)
  const hasDebts = items.length > 0
  const money = (value: number, opts?: Parameters<typeof formatMoney>[2]) => formatMoney(value, summary.currency, opts)

  return (
    <Card>
      <CardHead
        icon={<HandCoinsIcon className="size-4 text-destructive" />}
        title="Total Debt"
        bordered={false}
        badge={summary.debt_free_date && <DebtFreeBadge date={summary.debt_free_date} />}
        right={
          hasDebts ? (
            // TODO: point at the Debts page once it exists
            <Button variant="secondary" size="xs" asChild className="shadow-elevated">
              <Link to="/portfolio/$portfolioId/dashboard" params={{ portfolioId }}>
                View all
              </Link>
            </Button>
          ) : (
            <span />
          )
        }
      />

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 px-4 pt-3">
        <span className="font-heading text-[1.75rem] leading-9 font-bold tracking-[-0.0125rem] text-foreground">
          -{money(summary.total)}
        </span>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-xs leading-4 text-muted-foreground">Interest Paid YTD</span>
          <span className="font-medium text-foreground">+{money(summary.interest_paid_ytd)}</span>
        </div>
      </div>

      <div className="grid gap-4 px-4 pt-6 pb-4 @2xl:grid-cols-2">
        <DebtColumn
          edge="solid"
          stats={
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Scheduled Debt" value={`-${money(summary.scheduled_total)}`} />
              <Stat label="Monthly Payments" value={money(summary.monthly_payments)} />
            </div>
          }
        >
          {scheduled.length > 0
            ? scheduled.map((d) => <DebtRow key={d.debt_id} debt={d} />)
            : Array.from({ length: 3 }, (_, i) => <PlaceholderRow key={i} />)}
        </DebtColumn>

        <DebtColumn edge="hatched" stats={<Stat label="Unscheduled Debt" value={`-${money(summary.unscheduled_total)}`} />}>
          {unscheduled.length > 0 ? unscheduled.map((d) => <DebtRow key={d.debt_id} debt={d} />) : <PlaceholderRow />}
        </DebtColumn>
      </div>
    </Card>
  )
}

/** Red-edged column: thin left rule, bold (solid) or striped (hatched) bottom edge. */
function DebtColumn({ edge, stats, children }: { edge: 'solid' | 'hatched'; stats: ReactNode; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col border-l border-destructive">
      <div className="px-3 pt-0.5">{stats}</div>
      <ul className="mt-4 flex flex-1 flex-col divide-y divide-border px-3">{children}</ul>
      <span aria-hidden className={cn('-ml-px h-1', edge === 'solid' ? 'bg-destructive' : 'bg-hatch-destructive')} />
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs leading-4 text-muted-foreground">{label}</span>
      <span className="truncate font-medium text-foreground">{value}</span>
    </div>
  )
}

function DebtRow({ debt }: { debt: DashboardDebt }) {
  const Icon = DEBT_ICON[debt.debt_type] ?? HandCoinsIcon
  const rate = debt.interest_rate
  return (
    <li className="flex items-center justify-between gap-3 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive-subtle text-destructive">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate leading-5.5 font-medium text-foreground">{debt.name}</span>
          <span className="text-xs leading-4 text-muted-foreground">-{formatMoney(debt.balance, debt.currency)}</span>
        </div>
      </div>
      {debt.monthly_payment != null && (
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="leading-5.5 font-medium text-foreground">
            {formatMoney(debt.monthly_payment, debt.currency, { decimals: 0 })}/mo
          </span>
          {rate != null && (
            <span className={cn('text-xs leading-4', rate === 0 ? 'text-positive' : 'text-destructive')}>
              {rate === 0 ? 'Interest Free' : `${rate}% interest`}
            </span>
          )}
        </div>
      )}
    </li>
  )
}

/** "✦ Debt Free (Scheduled): Jan 2038 (~13 years)" */
function DebtFreeBadge({ date }: { date: string }) {
  const [now] = useState(Date.now) // read once on mount so render stays pure
  const d = new Date(date)
  const years = Math.max(0, Math.round((d.getTime() - now) / (365.25 * 86_400_000)))
  return (
    <span className="flex h-6 items-center gap-1.5 rounded-md border border-ai-from/50 bg-ai-tint px-2 text-xs whitespace-nowrap text-foreground">
      <AiSparkleIcon className="size-3" />
      Debt Free (Scheduled): {d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} (~{years} years)
    </span>
  )
}
