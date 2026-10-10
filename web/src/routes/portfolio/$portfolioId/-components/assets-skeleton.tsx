import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/** Loading state for the assets page: header, folder tabs, stat cards, table — same geometry as the real page. */
export function AssetsSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" role="status" aria-label="Loading assets">
      <div className="flex items-center justify-between px-10 pt-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-2.5 w-12" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5.5 w-28 rounded-md" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-22 rounded-lg" />
          <Skeleton className="h-8 w-30 rounded-lg" />
        </div>
      </div>

      <div className="mt-2 flex items-end gap-6 border-b px-10 pt-2.5 pb-2.5">
        {[24, 22, 26].map((w) => (
          <div key={w} className="flex items-center gap-2">
            <Skeleton className="size-4.5 rounded-[5px]" />
            <Skeleton className="h-3.25" style={{ width: w * 4 }} />
          </div>
        ))}
      </div>

      <div className="flex gap-4 px-10 pt-5">
        {[0, 1].map((i) => (
          <Card key={i} className="flex-1">
            <div className="flex flex-col gap-2.5 px-4 pt-4 pb-3">
              <Skeleton className="h-3.25 w-28" />
              <Skeleton className="h-9 w-40 rounded-md" />
            </div>
            <div className="flex divide-x border-t">
              {[0, 1].map((j) => (
                <div key={j} className="flex flex-1 flex-col gap-2 px-4 py-3">
                  <Skeleton className="h-2.75 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="mx-10 mb-10 flex min-h-0 flex-1 flex-col">
        <div className="flex justify-between py-4">
          <div className="flex gap-2">
            <Skeleton className="h-7 w-24 rounded-md" />
            <Skeleton className="h-7 w-26 rounded-md" />
          </div>
          <Skeleton className="h-8 w-60 rounded-lg" />
        </div>
        <Card className="flex-1">
          <div className="h-10 border-b" />
          <div className="divide-y">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex h-15 items-center gap-3 px-4">
                <Skeleton className="size-3.5" />
                <Skeleton className="size-9 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2.5 w-12" />
                </div>
                <Skeleton className="h-5.5 w-14 rounded-md" />
                <Skeleton className="ml-16 h-3 w-20" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
