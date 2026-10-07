import { useId } from 'react'
import { cn } from '@/lib/utils'
import type { DashboardChartPoint } from '../types'

const W = 800
const H = 160
const PAD = { t: 12, r: 8, b: 20, l: 8 }

/** Area line chart; blue when the period ends up, red when down. */
export function LineChart({ points }: { points: DashboardChartPoint[] }) {
  const gradientId = useId()

  if (points.length < 2) {
    return (
      <div className="flex h-45 items-center justify-center border bg-surface">
        <span className="text-xs text-subtle">Not enough history for this period — try a shorter range</span>
      </div>
    )
  }

  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const range = Math.max(...values) - min || 1
  const up = values.at(-1)! >= values[0]
  const cw = W - PAD.l - PAD.r
  const ch = H - PAD.t - PAD.b
  const xy = points.map((p, i) => [PAD.l + (i / (points.length - 1)) * cw, PAD.t + ch - ((p.value - min) / range) * ch])

  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${xy.at(-1)![0]},${H - PAD.b} L${xy[0][0]},${H - PAD.b} Z`

  return (
    <div className={cn('overflow-hidden border', up ? 'text-primary-dark' : 'text-destructive')}>
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Net worth trend, ${up ? 'up' : 'down'} over the period`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
