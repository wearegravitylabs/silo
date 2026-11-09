import { useLocation, type ErrorComponentProps } from '@tanstack/react-router'
import { DashboardSkeleton } from '@/features/dashboard'
import { ConnectionBanner } from '@/components/connection-banner'
import { RouteError } from '@/components/route-error'
import { Skeleton } from '@/components/ui/skeleton'
import { useSidebarStore } from '@/stores/sidebar-store'
import { isConnectionError } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { MainPanel } from '@/routes/-components/main-panel'
import { AssetsSkeleton } from './assets-skeleton'

/**
 * Error state for routes that load behind the shell skeleton: a lost connection keeps the skeleton, with the
 * connection banner under the top bar saying why; anything else is the usual route error.
 */
export function AppShellError(props: ErrorComponentProps) {
  return isConnectionError(props.error) ? <AppShellSkeleton error={props.error} /> : <RouteError {...props} />
}

/**
 * Whole-app placeholder for a cold load, before the portfolio (and so the real sidebar
 * and top bar) is known. Picks the page skeleton matching the URL. `error`: the load failed for want of a
 * connection, shown in the banner under the top bar.
 */
export function AppShellSkeleton({ error }: { error?: unknown }) {
  const collapsed = useSidebarStore((s) => s.collapsed)
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-dvh bg-surface">
      <aside className={cn('hidden h-dvh shrink-0 flex-col justify-between lg:flex', collapsed ? 'w-16' : 'w-67')} aria-hidden>
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

      <MainPanel>
        <div className="flex h-14 shrink-0 items-center justify-between gap-4 px-4 md:px-10" aria-hidden>
          <Skeleton className="hidden h-8 w-72 rounded-lg md:block lg:w-100" />
          <Skeleton className="size-8 rounded-lg md:hidden" />
          <div className="flex items-center gap-3 md:gap-6">
            <Skeleton className="hidden h-3 w-32 md:block" />
            <div className="flex items-center gap-2 md:gap-3">
              <Skeleton className="h-7 w-16 rounded-md" />
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-8 w-15 rounded-lg" />
            </div>
          </div>
        </div>
        {error !== undefined && <ConnectionBanner error={error} className="pb-3" />}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {pathname.endsWith('/assets') ? <AssetsSkeleton /> : <DashboardSkeleton />}
        </div>
      </MainPanel>
    </div>
  )
}
