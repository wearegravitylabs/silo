import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Loading state for the dashboard: same grid and card geometry as the real page. */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col pb-10" role="status" aria-label="Loading dashboard">
      <div className="flex items-end justify-between px-10 pt-7 pb-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-2.5 w-14" />
          <Skeleton className="h-6 w-44" />
        </div>
        <Skeleton className="h-7 w-28 rounded-md" />
      </div>

      <div className="flex flex-col gap-4 px-10">
        {/* Net worth */}
        <Card>
          <CardHeadSkeleton />
          <div className="flex items-end justify-between px-4 pt-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-52" />
              <Skeleton className="h-3 w-36" />
            </div>
            <div className="flex gap-8">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-10 w-1 rounded-2xl" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3.5 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4">
            <Skeleton className="h-40 w-full" />
            <div className="mt-2 flex justify-center gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-6 w-9 rounded-lg" />
              ))}
            </div>
          </div>
        </Card>

        {/* Allocation */}
        <Card>
          <CardHeadSkeleton />
          <div className="flex gap-6 p-4">
            {[0, 1].map((i) => (
              <div key={i} className="flex flex-1 flex-col gap-3">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-2 w-full" />
                <RowsSkeleton rows={3} height="h-10" />
              </div>
            ))}
          </div>
        </Card>

        {/* Movers */}
        <div className="flex gap-4">
          {[0, 1].map((i) => (
            <Card key={i} className="flex-1">
              <CardHeadSkeleton />
              <div className="px-4 pb-2">
                <RowsSkeleton rows={3} height="h-16" avatar />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

function CardHeadSkeleton() {
  return (
    <div className="flex h-11.5 items-center gap-2 border-b px-4">
      <Skeleton className="size-4 rounded-full" />
      <Skeleton className="h-3.5 w-24" />
    </div>
  )
}

function RowsSkeleton({ rows, height, avatar }: { rows: number; height: string; avatar?: boolean }) {
  return (
    <div className="flex flex-col divide-y">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={cn('flex items-center justify-between', height)}>
          <div className="flex items-center gap-3">
            {avatar && <Skeleton className="size-9 rounded-full" />}
            <Skeleton className="h-3.25 w-24" />
          </div>
          <Skeleton className="h-3.25 w-16" />
        </div>
      ))}
    </div>
  )
}
