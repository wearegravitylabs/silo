import { useEffect, type ReactNode } from 'react'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { connectionCopy } from '@/components/connection-banner'
import { AlertTriangleIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { useOnline, useRetryOnReconnect } from '@/hooks/use-online'
import { getErrorMessage, isConnectionError } from '@/lib/api-client'
import { cn } from '@/lib/utils'

/**
 * Default route error state: what went wrong + Retry (reloads the route's data). A lost connection says so and
 * retries by itself once it's back.
 */
export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter()
  const { reset } = useQueryErrorResetBoundary()
  const online = useOnline()
  const connection = isConnectionError(error)

  // Let React Query refetch failed queries when the route re-renders.
  useEffect(() => reset(), [reset])
  useRetryOnReconnect(connection, () => void router.invalidate())

  const copy = connection
    ? connectionCopy(online)
    : { title: 'Something went wrong', body: getErrorMessage(error, 'We couldn’t load this page. Try again.') }

  return (
    <StateMessage
      icon={<AlertTriangleIcon className="size-5 text-destructive" />}
      iconClassName="bg-destructive-subtle"
      title={copy.title}
      body={copy.body}
      action={
        <Button size="xs" onClick={() => router.invalidate()}>
          Try again
        </Button>
      }
    />
  )
}

/** Centred icon + title + body + action, for error, not-found and empty pages. */
export function StateMessage({
  icon,
  iconClassName,
  title,
  body,
  action,
}: {
  icon: ReactNode
  iconClassName?: string
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-1 animate-fade-in-up flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <div className={cn('flex size-11 items-center justify-center rounded-xl bg-accent', iconClassName)}>{icon}</div>
      <div className="flex max-w-80 flex-col gap-1">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-xs leading-5 text-muted-foreground">{body}</p>
      </div>
      {action}
    </div>
  )
}
