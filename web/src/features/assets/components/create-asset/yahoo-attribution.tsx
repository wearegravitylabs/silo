import { YahooFinanceWordmark } from '@/components/icons'
import { cn } from '@/lib/utils'

/** "Powered by yahoo!finance", required wherever ticker prices show. */
export function YahooAttribution({ className }: { className?: string }) {
  return (
    <p className={cn('flex items-center justify-center gap-1.5 text-xs leading-5 text-muted-foreground', className)}>
      Powered by <YahooFinanceWordmark />
    </p>
  )
}
