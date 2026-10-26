import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Loading folder card (Assets, Debts): the grey tab bar, and the stats row under it when `stats`. */
export function FolderCardSkeleton({ stats = false }: { stats?: boolean }) {
  return (
    <div className="mx-4 shrink-0 overflow-hidden rounded-2xl border md:mx-10">
      <div className={cn('flex h-11.5 bg-surface', stats && 'border-b border-border')}>
        <div className="flex items-center gap-2 border-r border-border bg-background px-4">
          <Skeleton className="size-4.5 rounded-sm" />
          <Skeleton className="h-3.25 w-20" />
        </div>
        <div className="w-11.5 border-r border-border" />
      </div>
      {stats && (
        <div className="grid md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className={cn('flex flex-col gap-3.5 px-4 pt-6 pb-4', i && 'border-t border-border md:border-t-0 md:border-l')}>
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-8 w-36 rounded-md" />
              <div className="grid grid-cols-2 gap-2">
                {[0, 1].map((j) => (
                  <div key={j} className="flex flex-col gap-2.5 px-3 pt-2 pb-3">
                    <Skeleton className="h-2.75 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
