import { useLocation } from '@tanstack/react-router'
import { DashboardSkeleton } from '@/features/dashboard'
import { Skeleton } from '@/components/ui/skeleton'
import { useSidebarStore } from '@/stores/sidebar-store'
import { cn } from '@/lib/utils'
import { AssetsSkeleton } from './assets-skeleton'
import { MainPanel } from './main-panel'

/**
 * Whole-app placeholder for a cold load, before the portfolio (and so the real sidebar
 * and top bar) is known. Picks the page skeleton matching the URL.
 */
export function AppShellSkeleton() {
  const collapsed = useSidebarStore((s) => s.collapsed)
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-dvh bg-surface">
      <aside className={cn('flex h-dvh shrink-0 flex-col justify-between', collapsed ? 'w-16' : 'w-67')} aria-hidden>
        <div className="flex flex-col gap-3">
          <div className={cn('flex h-14 items-center gap-2', collapsed ? 'justify-center' : 'px-3.5')}>
            <Skeleton className="size-6 rounded-full" />
            {!collapsed && <Skeleton className="h-3.5 w-28" />}
          </div>
          <div className="flex flex-col gap-1.5 px-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={cn('flex h-8 items-center gap-2', collapsed ? 'justify-center' : 'px-2')}>
                <Skeleton className="size-4 rounded-sm" />
                {!collapsed && <Skeleton className="h-3.5 w-20" />}
              </div>
            ))}
          </div>
        </div>
        <div className={cn('flex h-14 items-center', collapsed ? 'justify-center' : 'px-5')}>
          <Skeleton className="size-6 rounded-full" />
        </div>
      </aside>

      <MainPanel scrollable={!pathname.endsWith('/assets')}>
        <div className="flex h-14 shrink-0 items-center justify-between border-b px-10" aria-hidden>
          <Skeleton className="h-8 w-100" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-17 rounded-md" />
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className="h-7 w-13.5 rounded-md" />
          </div>
        </div>
        {pathname.endsWith('/assets') ? <AssetsSkeleton /> : <DashboardSkeleton />}
      </MainPanel>
    </div>
  )
}
