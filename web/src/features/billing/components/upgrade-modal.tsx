import { useId, useState } from 'react'
import { CircleCheckIcon, XIcon } from 'lucide-react'
import { CurrencyFlag } from '@/components/currency-flag'
import { ChevronDownIcon, PremiumIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { SegmentedTabs, SegmentedTabsList, SegmentedTabsTrigger } from '@/components/ui/segmented-tabs'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PREMIUM_FEATURES, PREMIUM_MONTHLY, premiumPrice, YEARLY_DISCOUNT, type BillingCycle } from '../data'

/**
 * Premium upsell: billing cycle and currency, price, Upgrade Plan, what's included — beside the brand
 * artwork. The artwork hides on small screens. Upgrade Plan reports through onUpgrade; `upgrading` shows progress.
 */
export function UpgradeModal({
  open,
  onOpenChange,
  defaultCurrency = 'NGN',
  defaultCycle = 'monthly',
  onUpgrade,
  upgrading = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultCurrency?: string
  defaultCycle?: BillingCycle
  onUpgrade?: (plan: { currency: string; cycle: BillingCycle }) => void
  /** The upgrade is in progress: Upgrade Plan shows a spinner. */
  upgrading?: boolean
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
                  <span className="rounded-sm border border-success-light bg-success-subtle px-1 text-[0.625rem] leading-4 font-medium text-success">
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
              <PremiumIcon />
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

          <Button
            size="lg"
            loading={upgrading}
            loadingText="Upgrading…"
            onClick={() => onUpgrade?.({ currency, cycle })}
            className="mt-6 w-full rounded-lg"
          >
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
          <ArtworkBuilding />
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

/** Centrepiece of the artwork panel: a building with a deep drop shadow and a soft top-edge highlight. */
function ArtworkBuilding() {
  const id = useId()
  return (
    <svg
      viewBox="60 30 53.26 80"
      className="h-20 w-13.25 drop-shadow-[0_1.875rem_3.75rem_var(--color-artwork-shadow)]"
      fill="none"
      aria-hidden
    >
      <defs>
        {/* Inner shadow: 21% white, 2.5 down, 2.5 blur */}
        <filter id={id} colorInterpolationFilters="sRGB">
          <feOffset in="SourceAlpha" dy="2.5" />
          <feGaussianBlur stdDeviation="2.5" />
          <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.21 0" />
          <feBlend in2="SourceGraphic" />
        </filter>
      </defs>
      <path
        filter={`url(#${id})`}
        fill="var(--color-artwork)"
        d="M113.203 30C113.216 32.0304 113.217 46.2744 113.217 48.3108H106.002V49.7391H113.203C113.212 52.2455 113.222 54.7523 113.217 57.2587H106.002V58.2414H113.212C113.208 60.6797 113.204 63.114 113.199 65.5523H106.002V66.7181H113.199C113.195 68.268 113.194 69.8228 113.194 71.3727C113.194 72.2019 113.199 73.0265 113.199 73.8556H106.002V75.0166H113.199C113.195 76.5666 113.194 78.1211 113.194 79.6712C113.194 80.5006 113.199 81.3259 113.199 82.1553H106.002V83.315H113.199C113.195 84.8651 113.194 86.4207 113.194 87.9709C113.194 88.8 113.199 89.6246 113.199 90.4538H106.002V91.7124H113.193L113.261 108.732V110H60V108.904C60.0136 103.175 60.0227 97.4413 60.0317 91.7124H67.2584V90.4538H60.0464C60.0509 88.0744 60.0549 85.6945 60.0549 83.315H67.2584V82.1553H60.0464C60.0509 79.7758 60.0549 77.3961 60.0549 75.0166H67.2584V73.8556H60.0464C60.0509 71.4765 60.0549 69.0973 60.0549 66.7181H67.2584V65.5523H60.0598C60.0643 63.114 60.0696 60.6797 60.0696 58.2414H67.2584V57.2587H60.0732C60.0732 54.7523 60.083 52.2455 60.083 49.7391H67.2584V48.3108H60.0732C60.0732 46.2755 60.083 41.299 60.083 39.2641L113.203 30Z"
      />
    </svg>
  )
}
