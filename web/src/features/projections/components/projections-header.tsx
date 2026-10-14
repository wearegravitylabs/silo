import { PageHeader } from '@/components/page-header'
import { TrendLine } from '@/components/trend-line'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SegmentedTabs, SegmentedTabsList, SegmentedTabsTrigger } from '@/components/ui/segmented-tabs'
import { formatMoney } from '@/lib/format'
import { HORIZON_YEARS, projectionChange } from '../constants'
import type { ProjectionView } from '../types'

const MONTH = new Date().toLocaleDateString('en-US', { month: 'short' })
const FIRST_YEAR = new Date().getFullYear() + 1

/** "Projections": the active scenario's value at the horizon and its change from today; horizon picker and view switch. */
export function ProjectionsHeader({
  value,
  start,
  currency,
  horizon,
  onHorizonChange,
  view,
  onViewChange,
}: {
  value: number
  start: number
  currency: string
  horizon: number
  onHorizonChange: (year: number) => void
  view: ProjectionView
  onViewChange: (view: ProjectionView) => void
}) {
  const change = projectionChange(value, start, currency)

  return (
    <PageHeader
      eyebrow="Projections"
      className="items-center px-4 pt-5 md:px-10"
      title={
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h1 className="text-xl leading-7">{formatMoney(value, currency)}</h1>
          <TrendLine delta={change.delta} amount={change.amount} pct={change.pct} />
        </div>
      }
      actions={
        <>
          <Select value={String(horizon)} onValueChange={(y) => onHorizonChange(Number(y))}>
            <SelectTrigger
              aria-label="Project to"
              className="h-7 w-auto gap-1 rounded-md border-0 bg-gradient-secondary px-2.5 text-xs font-semibold shadow-small [&_svg]:size-2.5"
            >
              <SelectValue>
                To {MONTH} {horizon}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start" className="max-h-97 w-36.5">
              {Array.from({ length: HORIZON_YEARS }, (_, i) => FIRST_YEAR + i).map((y) => (
                <SelectItem key={y} value={String(y)} className="data-[state=checked]:bg-accent">
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <SegmentedTabs value={view} onValueChange={(v) => onViewChange(v as ProjectionView)}>
            <SegmentedTabsList aria-label="View" className="w-60">
              <SegmentedTabsTrigger value="timestamp">Time Stamp</SegmentedTabsTrigger>
              <SegmentedTabsTrigger value="chart">Chart</SegmentedTabsTrigger>
            </SegmentedTabsList>
          </SegmentedTabs>
        </>
      }
    />
  )
}
