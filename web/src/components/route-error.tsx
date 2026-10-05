import { useEffect, type ReactNode } from 'react'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { AlertTriangleIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/api-client'
import { cn } from '@/lib/utils'

/** Default route error state: what went wrong + Retry (reloads the route's data). */
export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter()
  const { reset } = useQueryErrorResetBoundary()

  // Let React Query refetch failed queries when the route re-renders.
  useEffect(() => reset(), [reset])

  return (
    <StateMessage
      icon={<AlertTriangleIcon className="size-5 text-destructive" />}
      iconClassName="bg-destructive-subtle"
      title="Something went wrong"
      body={getErrorMessage(error, 'We couldn’t load this page. Check your connection and try again.')}
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
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs leading-5 text-muted-foreground">{body}</p>
      </div>
      {action}
    </div>
  )
}
