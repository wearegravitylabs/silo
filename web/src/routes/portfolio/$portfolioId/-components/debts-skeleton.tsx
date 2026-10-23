import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FolderCardSkeleton } from './folder-card-skeleton'

/** Loading state for the debts page: header, folder tabs, toolbar, table — same geometry as the real page. */
export function DebtsSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" role="status" aria-label="Loading debts">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-5 md:px-10">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-2.5 w-12" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      <div className="mt-5">
        <FolderCardSkeleton />
      </div>

      <div className="mx-4 mb-6 flex min-h-0 flex-1 flex-col md:mx-10 md:mb-10">
        <div className="flex flex-wrap justify-between gap-2 py-4">
          <div className="flex gap-2">
            <Skeleton className="h-7 w-24 rounded-md" />
            <Skeleton className="h-7 w-36 rounded-md" />
          </div>
          <Skeleton className="h-8 w-full rounded-lg md:w-100" />
        </div>
        <Card className="flex-1">
          <div className="h-12 border-b border-border" />
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex h-18 items-center gap-3 px-4">
                <Skeleton className="size-4" />
                <Skeleton className="size-10 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
                <Skeleton className="hidden h-3 w-16 md:block" />
                <Skeleton className="h-3 w-20 md:ml-24" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
