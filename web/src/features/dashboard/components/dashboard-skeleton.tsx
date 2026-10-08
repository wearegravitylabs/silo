import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Loading state for the dashboard: same grid and card geometry as the real page. */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col pb-10" role="status" aria-label="Loading dashboard">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 px-4 pt-7 pb-5 md:px-10">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-7 w-28 rounded-md" />
      </div>

      <div className="flex flex-col gap-4 px-4 md:px-10">
        <div className="flex flex-col gap-4 xl:flex-row">
          {/* Net worth */}
          <Card className="min-w-0 xl:flex-1">
            <CardHeadSkeleton bordered={false} />
            <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-5 px-4 pt-3">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-9 w-56" />
                <Skeleton className="h-3 w-40" />
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-stretch gap-2.5">
                    <Skeleton className="w-0.75 rounded-full" />
                    <div className="flex flex-col gap-2 py-0.5">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3.5 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 pt-6 pb-4">
              <Skeleton className="h-50 w-full rounded-xl" />
              <div className="mt-3 flex justify-center gap-1">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-6 w-8 rounded-md" />
                ))}
              </div>
            </div>
          </Card>

          {/* AI insights */}
          <div className="flex h-104 shrink-0 flex-col gap-3 rounded-2xl border border-border p-4 xl:h-auto xl:w-79">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-3.5 w-20" />
            </div>
            <Skeleton className="w-full flex-1 rounded-xl" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        </div>

        {/* Allocation */}
        <Card>
          <CardHeadSkeleton bordered={false} />
          <div className="grid lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex flex-col gap-2 border-border px-4 pt-3 not-first:border-t not-first:pt-4 lg:not-first:border-t-0 lg:not-first:border-l lg:not-first:pt-3"
              >
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="mt-3 h-4 w-full rounded-xs" />
                <div className="mt-3 border-t border-border">
                  <RowsSkeleton rows={4} height="h-11.5" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Movers */}
        <div className="flex flex-col gap-4 md:flex-row">
          {[0, 1].map((i) => (
            <Card key={i} className="min-w-0 flex-1">
              <CardHeadSkeleton bordered={false} action />
              <div className="px-4 pb-1">
                <RowsSkeleton rows={3} height="h-18" avatar />
              </div>
            </Card>
          ))}
        </div>

        {/* Total debt */}
        <Card>
          <CardHeadSkeleton bordered={false} action />
          <div className="flex items-start justify-between gap-6 px-4 pt-3">
            <Skeleton className="h-9 w-52" />
            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3.5 w-20" />
            </div>
          </div>
          <div className="grid gap-4 px-4 pt-6 pb-4 md:grid-cols-2">
            {[3, 1].map((rows, i) => (
              <div key={i} className="flex flex-col border-l border-border">
                <div className="flex flex-col gap-2 px-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
                <div className="mt-4 flex-1 px-3">
                  <RowsSkeleton rows={rows} height="h-18" avatar />
                </div>
                <Skeleton className="-ml-px h-1 rounded-none" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function CardHeadSkeleton({ bordered = true, action = false }: { bordered?: boolean; action?: boolean }) {
  return (
    <div className={cn('flex h-11.5 items-center justify-between px-4', bordered && 'border-b')}>
      <span className="flex items-center gap-2">
        <Skeleton className="size-4 rounded-full" />
        <Skeleton className="h-3.5 w-24" />
      </span>
      {action && <Skeleton className="h-7 w-16 rounded-md" />}
    </div>
  )
}

function RowsSkeleton({ rows, height, avatar }: { rows: number; height: string; avatar?: boolean }) {
  return (
    <div className="flex flex-col divide-y">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={cn('flex items-center justify-between', height)}>
          <div className="flex items-center gap-3">
            {avatar && <Skeleton className="size-10 rounded-full" />}
            <Skeleton className="h-3.25 w-24" />
          </div>
          <Skeleton className="h-3.25 w-16" />
        </div>
      ))}
    </div>
  )
}
