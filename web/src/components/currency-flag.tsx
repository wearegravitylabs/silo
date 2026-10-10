import { AE, AU, BR, CA, CH, CN, EU, GB, GH, IN, JP, KE, MX, NG, US, ZA } from 'country-flag-icons/react/1x1'
import { cn } from '@/lib/utils'

// Named imports keep the bundle to these flags only. Add a currency here when the app supports it.
const FLAGS: Record<string, typeof US> = {
  AED: AE,
  AUD: AU,
  BRL: BR,
  CAD: CA,
  CHF: CH,
  CNY: CN,
  EUR: EU,
  GBP: GB,
  GHS: GH,
  INR: IN,
  JPY: JP,
  KES: KE,
  MXN: MX,
  NGN: NG,
  USD: US,
  ZAR: ZA,
}

/** Round flag for an ISO 4217 currency code. Size with className (default size-4). Unknown codes show their first letter. */
export function CurrencyFlag({ code, className }: { code: string; className?: string }) {
  const Flag = FLAGS[code.toUpperCase()]
  const base = cn('size-4 shrink-0 overflow-hidden rounded-full', className)

  if (!Flag) {
    return (
      <span aria-hidden className={cn(base, 'flex items-center justify-center bg-line text-[0.5rem] font-semibold text-muted-foreground')}>
        {code[0]}
      </span>
    )
  }
  return (
    <span aria-hidden className={base}>
      <Flag className="size-full" />
    </span>
  )
}
