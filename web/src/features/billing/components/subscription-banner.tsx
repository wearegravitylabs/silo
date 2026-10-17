import { useState } from 'react'
import { CircleAlertIcon } from 'lucide-react'
import { useSubscription } from '../queries'
import { PlanUpgradeModal } from './plan-upgrade-modal'

/**
 * Strip under the app shell once the trial has ended or Premium is overdue: "Subscribe" opens the Upgrade modal.
 * Renders nothing while the plan is active.
 */
export function SubscriptionBanner() {
  const { data: subscription } = useSubscription()
  const [upgrading, setUpgrading] = useState(false)
  if (!subscription || subscription.status === 'active') return null

  return (
    <div role="status" className="flex shrink-0 animate-rise items-center justify-center gap-2 bg-warning-subtle px-4 py-3 text-warning">
      <CircleAlertIcon className="size-4 shrink-0 fill-warning text-warning-subtle" aria-hidden />
      <p className="text-center font-medium text-warning">
        <button
          type="button"
          onClick={() => setUpgrading(true)}
          className="rounded-sm underline underline-offset-2 outline-none hover:opacity-70 focus-visible:ring-2 focus-visible:ring-warning/40"
        >
          Subscribe
        </button>{' '}
        to continue using Silo. Assets, Debts, Vaults will be deleted within 30 days of expiry
      </p>
      <PlanUpgradeModal open={upgrading} onOpenChange={setUpgrading} />
    </div>
  )
}
