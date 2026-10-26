import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const pctFormat = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 0 })

/** "↓ 43%", "↑ 1k%": a fall is red, a rise green; big moves shorten. */
export function ValueChange({ pct }: { pct: number }) {
  const up = pct > 0
  const Icon = up ? ArrowUpIcon : ArrowDownIcon
  return (
    <span className={cn('flex items-center gap-1', up ? 'text-success' : 'text-destructive')}>
      <Icon className="size-3.5" aria-label={up ? 'Up' : 'Down'} />
      {pctFormat.format(Math.abs(pct)).toLowerCase()}%
    </span>
  )
}
