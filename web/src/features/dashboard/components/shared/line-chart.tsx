import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { DashboardChartPoint } from '../../types'

const PAD = { t: 16, r: 4, b: 24, l: 4 } // room for the glow below the line

/**
 * Smooth net-worth line with a soft glow beneath it; brand blue when the period ends up, red when down.
 * Fills its box: size it with className (e.g. h-50, or flex-1 inside a fixed-height card).
 */
export function LineChart({ points, className }: { points: DashboardChartPoint[]; className?: string }) {
  const glowId = useId()
  const ref = useRef<HTMLDivElement>(null)
  const { width, height } = useSize(ref)

  // No history yet: keep the space, draw nothing (the design leaves it blank).
  // The measured wrapper always renders, so the size is known whenever data arrives.
  if (points.length < 2) return <div ref={ref} className={cn('w-full', className)} aria-hidden />

  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const range = Math.max(...values) - min || 1
  const up = values.at(-1)! >= values[0]
  const cw = Math.max(width - PAD.l - PAD.r, 0)
  const ch = Math.max(height - PAD.t - PAD.b, 0)
  const xy = points.map((p, i): [number, number] => [PAD.l + (i / (points.length - 1)) * cw, PAD.t + ch - ((p.value - min) / range) * ch])
  const line = smoothPath(xy)

  return (
    <div ref={ref} className={cn('w-full', up ? 'text-primary-dark' : 'text-destructive', className)}>
      {width > 0 && height > 0 && (
        <svg
          width={width}
          height={height}
          className="block"
          role="img"
          aria-label={`Net worth trend, ${up ? 'up' : 'down'} over the period`}
        >
          <defs>
            <filter id={glowId} x="-5%" y="-20%" width="110%" height="160%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>
          <path
            d={line}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            opacity="0.25"
            transform="translate(0 8)"
            filter={`url(#${glowId})`}
          />
          <path d={line} stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

/** Catmull-Rom spline through the points, as cubic Béziers. */
function smoothPath(pts: [number, number][]) {
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1] ?? pts[i]
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[i + 1]
    const [x3, y3] = pts[i + 2] ?? pts[i + 1]
    const c1 = [x1 + (x2 - x0) / 6, y1 + (y2 - y0) / 6]
    const c2 = [x2 - (x3 - x1) / 6, y2 - (y3 - y1) / 6]
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`
  }
  return d
}

/** Live size of an element, so the chart draws in real pixels (crisp 1.5px stroke, round glow). */
function useSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}
