import { createRouter } from '@tanstack/react-router'
import { NotFound } from '@/components/not-found'
import { RouteError } from '@/components/route-error'
import { queryClient } from '@/lib/query-client'
import { routeTree } from './route-tree.gen'

export const router = createRouter({
  routeTree,
  context: { queryClient },
  // Preload a route's data on link hover/focus.
  defaultPreload: 'intent',
  // React Query owns caching; let loaders always defer to it.
  defaultPreloadStaleTime: 0,
  // Show a page's skeleton only if loading takes >150ms, and then for at least 300ms (no flicker).
  defaultPendingMs: 150,
  defaultPendingMinMs: 300,
  defaultErrorComponent: RouteError,
  defaultNotFoundComponent: NotFound,
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
