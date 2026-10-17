import { toast } from 'sonner'
import { useSubscribe, useSubscription } from '../queries'
import { UpgradeModal } from './upgrade-modal'

/** The Upgrade modal wired to the account's plan: Upgrade Plan subscribes; on Premium its cycle reads "Current Plan". */
export function PlanUpgradeModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: subscription } = useSubscription()
  const subscribe = useSubscribe()
  const premium = subscription?.plan === 'premium' && subscription.status === 'active'

  return (
    <UpgradeModal
      // Remount per plan so the tabs open on the plan's own cycle and currency
      key={`${subscription?.plan}-${subscription?.cycle}-${subscription?.currency}`}
      open={open}
      onOpenChange={onOpenChange}
      defaultCurrency={subscription?.currency}
      defaultCycle={subscription?.cycle}
      currentCycle={premium ? subscription.cycle : undefined}
      upgrading={subscribe.isPending}
      onUpgrade={(plan) =>
        subscribe.mutate(plan, {
          onSuccess: () => {
            onOpenChange(false)
            toast.success('You’re now on Premium')
          },
          onError: () => toast.error('Couldn’t upgrade your plan. Try again.'),
        })
      }
    />
  )
}
