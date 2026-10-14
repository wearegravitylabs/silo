import { useRef, useState } from 'react'
import { ChevronDownIcon } from '@/components/icons'
import { formatPointDate, smoothPath, useSize } from '@/components/line-chart'
import { MultiFilterMenu } from '@/components/multi-filter-menu'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { fillTint, METRIC_LABELS, projectionMoney } from '../constants'
import type { ProjectionMetric, ProjectionPoint, Scenario } from '../types'

const PAD_BOTTOM = 20
const PAD_BELOW_LEGEND = 14 // room between the legend row and the highest point
const TIP_HALF = 72 // keeps the tooltip inside the card near the edges

export interface ChartSeries {
  scenario: Scenario
  points: ProjectionPoint[]
}

/**
 * Scenario curves edge to edge on one shared scale, each with a faint fill below. Legend (scenario, value at the
 * horizon) top left; metric and scenario pickers top right. Hover, touch-drag or arrow keys read every line at a month.
 */
export function ProjectionChart({
  series,
  scenarios,
  visible,
  onVisibleChange,
  metric,
  onMetricChange,
  currency,
}: {
  /** The visible scenarios' projections, drawn in this order (first on top) */
  series: ChartSeries[]
  scenarios: Scenario[]
  visible: string[]
  onVisibleChange: (ids: string[]) => void
  metric: ProjectionMetric
  onMetricChange: (metric: ProjectionMetric) => void
  currency: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLDivElement>(null)
  const { width, height } = useSize(ref)
  const { height: headHeight } = useSize(headRef)
  const [active, setActive] = useState<number | null>(null)

  const months = Math.max(0, ...series.map((s) => s.points.length - 1))
  const values = series.flatMap((s) => s.points.map((p) => p.value))
  const min = Math.min(...values)
  const range = Math.max(...values) - min || 1
  const top = headHeight + 16 + PAD_BELOW_LEGEND
  const ch = Math.max(height - top - PAD_BOTTOM, 0)
  const x = (i: number) => (months ? (i / months) * width : 0)
  const y = (v: number) => top + ch - ((v - min) / range) * ch

  const i = active == null ? null : Math.min(active, months)
  const pick = (clientX: number) => {
    const left = ref.current?.getBoundingClientRect().left ?? 0
    setActive(Math.round(Math.min(Math.max((clientX - left) / (width || 1), 0), 1) * months))
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key]
    if (step) setActive((a) => Math.min(Math.max((a ?? (step > 0 ? -1 : months + 1)) + step, 0), months))
    else if (e.key === 'Escape') setActive(null)
    else return
    e.preventDefault()
  }

  return (
    <div className="relative h-77.5 overflow-hidden rounded-2xl border border-border bg-background">
      <div
        ref={ref}
        tabIndex={0}
        aria-label="Projection chart. Use the arrow keys to read values."
        onPointerMove={(e) => pick(e.clientX)}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerLeave={() => setActive(null)}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
        className="absolute inset-0 touch-pan-y outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset"
      >
        {width > 0 && height > 0 && months > 0 && (
          <svg width={width} height={height} className="block" role="img" aria-label="Projected value per scenario">
            {/* Fills first, highest curve first so each lower one covers it (opaque tints, as in the design), then the lines */}
            {[...series]
              .sort((a, b) => (b.points.at(-1)?.value ?? 0) - (a.points.at(-1)?.value ?? 0))
              .map(({ scenario, points }) => (
                <path
                  key={scenario.id}
                  d={`${smoothPath(points.map((p, k) => [x(k), y(p.value)]))} L${width},${height} L0,${height} Z`}
                  // Light colours need a stronger tint to read as the same faint fill
                  style={{ fill: `color-mix(in srgb, ${scenario.color} ${fillTint(scenario.color)}%, var(--color-background))` }}
                />
              ))}
            {i != null && <line x1={x(i)} x2={x(i)} y1={top - 8} y2={height} className="stroke-line" shapeRendering="crispEdges" />}
            {[...series].reverse().map(({ scenario, points }) => (
              <g key={scenario.id} style={{ color: scenario.color }}>
                <path
                  d={smoothPath(points.map((p, k) => [x(k), y(p.value)]))}
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                {i != null && points[i] && (
                  <circle cx={x(i)} cy={y(points[i].value)} r="4.5" className="fill-white" stroke="currentColor" strokeWidth="1.5" />
                )}
              </g>
            ))}
          </svg>
        )}

        {i != null && series[0]?.points[i] && (
          <div
            className="pointer-events-none absolute z-10 flex min-w-36 flex-col gap-1 rounded-lg bg-ink px-2.5 py-1.5 whitespace-nowrap shadow-dropdown"
            style={{ left: Math.min(Math.max(x(i), TIP_HALF), width - TIP_HALF), top, transform: 'translateX(-50%)' }}
          >
            <span className="text-[0.6875rem] leading-4 text-white/60">{formatPointDate(series[0].points[i].date)}</span>
            {series.map(({ scenario, points }) => (
              <span key={scenario.id} className="flex items-center justify-between gap-3 text-xs leading-5 text-white">
                <span className="flex items-center gap-1.5 text-white/80">
                  <span className="size-1.5 rounded-full" style={{ background: scenario.color }} />
                  {scenario.name}
                </span>
                <span className="font-semibold">{projectionMoney(points[i].value, currency, 0)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Legend and pickers ride on top of the chart; on narrow cards the pickers wrap under the legend. */}
      <div ref={headRef} className="pointer-events-none absolute inset-x-4 top-4 flex flex-wrap items-start justify-between gap-3">
        <dl className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
          {series.map(({ scenario, points }) => (
            <div key={scenario.id} className="flex items-stretch gap-2.5">
              <span className="w-1 shrink-0 rounded-full" style={{ background: scenario.color }} />
              <div className="flex flex-col gap-1.5 py-0.5">
                <dt className="text-xs leading-4 text-muted-foreground">{scenario.name}</dt>
                <dd className="text-foreground">{projectionMoney(points.at(-1)?.value ?? 0, currency, 0)}</dd>
              </div>
            </div>
          ))}
        </dl>
        <div className="pointer-events-auto flex items-center gap-2">
          <MetricMenu value={metric} onChange={onMetricChange} />
          <MultiFilterMenu
            label="Scenarios"
            allLabel="All Scenarios"
            options={scenarios.map((s) => ({ value: s.id, label: s.name }))}
            values={visible}
            onChange={onVisibleChange}
            contentClassName="w-44"
          />
        </div>
      </div>
    </div>
  )
}

/** "Net Worth" / "Net Worth + Cash"; the current one is shaded. */
function MetricMenu({ value, onChange }: { value: ProjectionMetric; onChange: (metric: ProjectionMetric) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="xs" className="group gap-1 font-medium">
          {METRIC_LABELS[value]}
          <ChevronDownIcon className="size-2.5 text-muted-foreground transition-transform duration-200 group-aria-expanded:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {(Object.keys(METRIC_LABELS) as ProjectionMetric[]).map((m) => (
          <DropdownMenuItem
            key={m}
            role="menuitemradio"
            aria-checked={m === value}
            onSelect={() => onChange(m)}
            className={cn(m === value && 'bg-accent')}
          >
            {METRIC_LABELS[m]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
