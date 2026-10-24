import { CoinGeckoWordmark, YahooFinanceWordmark } from '@/components/icons'
import { cn } from '@/lib/utils'

/** "Powered by …" for the market data shown (Yahoo Finance for stocks, CoinGecko for crypto). */
export function DataAttribution({ source, className }: { source: 'yahoo' | 'coingecko'; className?: string }) {
  return (
    <p className={cn('flex items-center justify-center gap-1.5 text-xs leading-5 text-muted-foreground', className)}>
      Powered by {source === 'yahoo' ? <YahooFinanceWordmark /> : <CoinGeckoWordmark />}
    </p>
  )
}
