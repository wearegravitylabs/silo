import { useState, useSyncExternalStore } from 'react'
import { useQueryClient, type Query } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { Callout } from '@/components/callout'
import { RefreshIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { useOnline, useRetryOnReconnect } from '@/hooks/use-online'
import { isConnectionError } from '@/lib/api-client'
import { cn } from '@/lib/utils'

/** What to tell the user when data can't load for want of a connection. */
export function connectionCopy(online: boolean) {
  return online
    ? { title: 'Can’t reach Silo right now', body: 'We couldn’t load your latest data. Try again in a moment.' }
    : { title: 'You’re offline', body: 'Check your connection. We’ll try again as soon as you’re back online.' }
}

// A query the page on screen uses whose last fetch failed for want of a connection.
const failedOnScreen = (query: Query) =>
  query.getObserversCount() > 0 && query.state.status === 'error' && isConnectionError(query.state.error)

/**
 * Strip under the app header for when data can't load because the device is offline or the API can't be reached:
 * says which, offers Retry, and retries by itself when the connection comes back. It watches the queries the page on
 * screen uses, so pages need nothing of their own. Pass `error` to show it for a route that failed to load instead.
 */
export function ConnectionBanner({ error, className }: { error?: unknown; className?: string }) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const online = useOnline()
  const [retrying, setRetrying] = useState(false)

  const cache = queryClient.getQueryCache()
  const queriesFailed = useSyncExternalStore(
    (onChange) => cache.subscribe(onChange),
    () => cache.getAll().some(failedOnScreen),
  )
  const show = queriesFailed || isConnectionError(error)

  const retry = async () => {
    setRetrying(true)
    try {
      await (error ? router.invalidate() : queryClient.refetchQueries({ predicate: failedOnScreen }))
    } finally {
      setRetrying(false)
    }
  }
  useRetryOnReconnect(show, () => void retry())

  if (!show) return null
  const { title, body } = connectionCopy(online)
  return (
    <div className={cn('shrink-0 px-4 md:px-10', className)}>
      <Callout
        variant="error"
        title={title}
        action={
          <Button variant="secondary" size="xs" onClick={() => void retry()} disabled={retrying} className="gap-1">
            <RefreshIcon className={cn('text-foreground', retrying && 'animate-spin')} />
            Retry
          </Button>
        }
      >
        {body}
      </Callout>
    </div>
  )
}
