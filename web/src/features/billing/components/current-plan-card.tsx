import { FramedCard } from '@/components/framed-card'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { formatDayMonthYear, formatMoney } from '@/lib/format'
import type { Subscription } from '../types'

/**
 * "CURRENT PLAN": the trial (End Trial + Upgrade Plan while it runs, Upgrade Plan once it's over) or Premium with
 * its price (Manage Plan), and when it ends or renews underneath. Buttons drop below the plan on narrow screens.
 */
export function CurrentPlanCard({
  subscription,
  onEndTrial,
  onUpgrade,
  className,
}: {
  subscription: Subscription
  onEndTrial: () => void
  /** Upgrade Plan / Manage Plan */
  onUpgrade: () => void
  className?: string
}) {
  const { plan, status, trial_days: days } = subscription
  const trial = plan === 'trial'
  const active = status === 'active'
  const date = formatDayMonthYear(subscription.period_end, { comma: true })
  const footer = trial
    ? `Your free plan ${active ? 'expires' : 'expired'} on ${date}`
    : active
      ? `Your subscription will auto renew on ${date}`
      : `Your subscription expired on ${date}`

  return (
    <FramedCard label="Current Plan" footer={footer} className={className}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl border bg-background p-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h3 className="flex flex-wrap items-center gap-1.5 font-sans text-sm leading-5.5 font-medium tracking-normal">
            {trial ? `${days}-days Free Trial` : 'Premium'}
            <StatusBadge tone={active ? 'success' : 'destructive'}>{active ? 'Active' : trial ? 'Inactive' : 'Overdue'}</StatusBadge>
          </h3>
          {trial ? (
            <p className="text-xs leading-5">Free trial for {days} days without commitment</p>
          ) : (
            <p className="flex items-baseline gap-1.5">
              <span className="font-heading text-2xl leading-8 font-bold text-foreground">
                {formatMoney(subscription.amount, subscription.currency, { spaced: false, decimals: 0 })}
              </span>
              <span className="text-xs leading-5">per {subscription.cycle === 'monthly' ? 'month' : 'year'}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {trial && active && (
            <Button variant="destructive-subtle" size="xs" onClick={onEndTrial}>
              End Trial
            </Button>
          )}
          <Button variant="secondary" size="xs" onClick={onUpgrade}>
            {trial ? 'Upgrade Plan' : 'Manage Plan'}
          </Button>
        </div>
      </div>
    </FramedCard>
  )
}
