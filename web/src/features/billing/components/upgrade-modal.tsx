import { useState } from 'react'
import { CircleCheckIcon, GemIcon, XIcon } from 'lucide-react'
import { CurrencyFlag } from '@/components/currency-flag'
import { ChevronDownIcon } from '@/components/icons'
import { LogoMark } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { SegmentedTabs, SegmentedTabsList, SegmentedTabsTrigger } from '@/components/ui/segmented-tabs'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PREMIUM_FEATURES, PREMIUM_MONTHLY, premiumPrice, YEARLY_DISCOUNT, type BillingCycle } from '../data'

/**
 * Premium upsell: billing cycle and currency, price, Upgrade Plan, what's included — beside the brand
 * artwork. The artwork hides on small screens. UI only for now: Upgrade Plan reports through onUpgrade.
 */
export function UpgradeModal({
  open,
  onOpenChange,
  defaultCurrency = 'NGN',
  defaultCycle = 'monthly',
  onUpgrade,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultCurrency?: string
  defaultCycle?: BillingCycle
  onUpgrade?: (plan: { currency: string; cycle: BillingCycle }) => void
}) {
  const [cycle, setCycle] = useState<BillingCycle>(defaultCycle)
  const [currency, setCurrency] = useState(defaultCurrency in PREMIUM_MONTHLY ? defaultCurrency : 'NGN')
  const price = formatMoney(premiumPrice(currency, cycle), currency, { spaced: false, decimals: 0 })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="flex-row">
        <div className="flex min-w-0 flex-1 flex-col p-8">
          <div className="flex items-center justify-between gap-3">
            <SegmentedTabs value={cycle} onValueChange={(v) => setCycle(v as BillingCycle)}>
              <SegmentedTabsList aria-label="Billing cycle">
                <SegmentedTabsTrigger value="monthly" className="px-2.5">
                  Monthly
                </SegmentedTabsTrigger>
                <SegmentedTabsTrigger value="yearly" className="gap-1.5 px-2.5">
                  Yearly
                  <span className="rounded-sm bg-success-light px-1 text-[0.625rem] leading-4 font-medium text-success">
                    -{YEARLY_DISCOUNT * 100}%
                  </span>
                </SegmentedTabsTrigger>
              </SegmentedTabsList>
            </SegmentedTabs>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="xs" className="gap-1.5 shadow-small" aria-label={`Currency: ${currency}`}>
                  <CurrencyFlag code={currency} className="size-3.5" />
                  {currency}
                  <ChevronDownIcon className="text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {Object.keys(PREMIUM_MONTHLY).map((code) => (
                  <DropdownMenuItem key={code} onSelect={() => setCurrency(code)} className={cn(code === currency && 'bg-accent')}>
                    <CurrencyFlag code={code} />
                    {code}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-8 flex flex-col gap-1.5">
            <DialogTitle className="flex items-center gap-2">
              <GemIcon className="size-4 fill-success-light text-success" aria-hidden />
              Premium
            </DialogTitle>
            <DialogDescription className="text-[0.8125rem] leading-5">Gain full access personalized portfolio manager</DialogDescription>
          </div>

          <div className="mt-8 flex flex-col gap-1">
            <span key={`${currency}-${cycle}`} className="animate-rise font-heading text-[1.75rem] leading-9 font-bold text-foreground">
              {price}
            </span>
            <span className="text-xs leading-5 text-muted-foreground">per {cycle === 'monthly' ? 'month' : 'year'}</span>
          </div>

          <Button size="lg" onClick={() => onUpgrade?.({ currency, cycle })} className="mt-6 w-full rounded-lg">
            Upgrade Plan
          </Button>

          <ul className="mt-6 flex flex-col gap-3">
            {PREMIUM_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-[0.8125rem] leading-5 text-foreground">
                <CircleCheckIcon className="size-4 shrink-0 fill-muted-foreground text-white" aria-hidden />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Brand artwork (desktop only) */}
        <div
          aria-hidden
          className="relative hidden flex-1 items-center justify-center bg-night bg-[url(/auth/backdrop.png)] bg-cover bg-center md:flex"
        >
          <LogoMark className="h-20 w-16 opacity-80 [&_path]:fill-white [&_rect]:fill-white" />
        </div>

        <DialogClose
          aria-label="Close"
          className={cn(
            'absolute top-4 right-4 flex size-8 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            // over the artwork on desktop; on the white panel when the artwork is hidden
            'text-muted-foreground hover:bg-accent md:bg-white/15 md:text-white md:hover:bg-white/25',
          )}
        >
          <XIcon className="size-4" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
