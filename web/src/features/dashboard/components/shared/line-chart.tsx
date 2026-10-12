import { useEffect, useId, useRef, useState } from 'react'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DashboardChartPoint } from '../../types'

const PAD = { t: 16, r: 4, b: 24, l: 4 } // room for the glow below the line
const TIP_HALF = 56 // keeps the tooltip inside the chart near the edges
const TIP_ROOM = 64 // below this many px from the top, the tooltip drops under the point

/**
 * Smooth net-worth line with a soft glow beneath it; brand blue when the period ends up, red when down.
 * Hover, touch-drag or arrow keys pick a point: crosshair, dot, value + date tooltip, and the line fades after it.
 * Fills its box: size it with className (e.g. h-50, or flex-1 inside a fixed-height card).
 */
export function LineChart({ points, currency, className }: { points: DashboardChartPoint[]; currency: string; className?: string }) {
  const glowId = useId()
  const beforeId = useId()
  const afterId = useId()
  const ref = useRef<HTMLDivElement>(null)
  const { width, height } = useSize(ref)
  const [active, setActive] = useState<number | null>(null)

  // No history yet: keep the space, draw nothing (the design leaves it blank).
  // The measured wrapper always renders, so the size is known whenever data arrives.
  if (points.length < 2) return <div ref={ref} className={cn('w-full', className)} aria-hidden />

  const last = points.length - 1
  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const range = Math.max(...values) - min || 1
  const up = values[last] >= values[0]
  const cw = Math.max(width - PAD.l - PAD.r, 0)
  const ch = Math.max(height - PAD.t - PAD.b, 0)
  const xy = points.map((p, i): [number, number] => [PAD.l + (i / last) * cw, PAD.t + ch - ((p.value - min) / range) * ch])
  const line = smoothPath(xy)

  // A new period can have fewer points than the one hovered.
  const i = active == null ? null : Math.min(active, last)
  const [cx, cy] = i == null ? [0, 0] : xy[i]
  const point = i == null ? null : points[i]

  const pick = (clientX: number) => {
    const left = ref.current?.getBoundingClientRect().left ?? 0
    setActive(Math.round(Math.min(Math.max((clientX - left - PAD.l) / (cw || 1), 0), 1) * last))
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key]
    if (step) setActive((a) => Math.min(Math.max((a ?? (step > 0 ? -1 : last + 1)) + step, 0), last))
    else if (e.key === 'Home') setActive(0)
    else if (e.key === 'End') setActive(last)
    else if (e.key === 'Escape') setActive(null)
    else return
    e.preventDefault()
  }

  const series = (
    <>
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
    </>
  )

  return (
    <div
      ref={ref}
      tabIndex={0}
      aria-label="Net worth chart. Use the arrow keys to read values."
      onPointerMove={(e) => pick(e.clientX)}
      onPointerDown={(e) => pick(e.clientX)}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
      className={cn(
        'relative w-full touch-pan-y rounded-md outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/40',
        up ? 'text-primary-dark' : 'text-destructive',
        className,
      )}
    >
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
            <clipPath id={beforeId}>
              <rect width={cx} height={height} />
            </clipPath>
            <clipPath id={afterId}>
              <rect x={cx} width={Math.max(width - cx, 0)} height={height} />
            </clipPath>
          </defs>

          {i == null ? (
            series
          ) : (
            <>
              <g className="stroke-line" strokeWidth="1" shapeRendering="crispEdges">
                <line x1={cx} x2={cx} y1={0} y2={height} />
                <line x1={0} x2={width} y1={cy} y2={cy} />
              </g>
              <g clipPath={`url(#${beforeId})`}>{series}</g>
              <g clipPath={`url(#${afterId})`} opacity="0.25">
                {series}
              </g>
              <circle cx={cx} cy={cy} r="4.5" className="fill-white" stroke="currentColor" strokeWidth="1.5" />
            </>
          )}
        </svg>
      )}

      {point && (
        <div
          className="pointer-events-none absolute z-10 flex flex-col items-center rounded-lg bg-ink px-2.5 py-1.5 whitespace-nowrap shadow-dropdown"
          style={{
            left: Math.min(Math.max(cx, TIP_HALF), width - TIP_HALF),
            top: cy,
            transform: `translate(-50%, ${cy < TIP_ROOM ? '12px' : 'calc(-100% - 12px)'})`,
          }}
        >
          <span className="text-xs leading-5 font-semibold text-white">{formatMoney(point.value, currency, { decimals: 0 })}</span>
          <span className="text-[0.6875rem] leading-4 text-white/60">{formatPointDate(point.date)}</span>
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {point && `${formatMoney(point.value, currency, { decimals: 0 })}, ${formatPointDate(point.date)}`}
      </span>
    </div>
  )
}

/** "10 Jan, 2025"; intraday timestamps give "10 Jan, 14:00". Plain dates are read as local days, not UTC midnight. */
function formatPointDate(date: string) {
  const intraday = date.includes('T')
  const [y, m, d] = date.slice(0, 10).split('-').map(Number)
  const day = intraday ? new Date(date) : new Date(y, m - 1, d)
  const dayMonth = day.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const tail = intraday ? day.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : day.getFullYear()
  return `${dayMonth}, ${tail}`
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
