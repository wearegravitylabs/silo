import { cn } from '@/lib/utils'

/** Placeholder block. Size it with w-/h- classes; shape it with rounded-*. */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div aria-hidden className={cn('shrink-0 animate-pulse rounded-sm bg-accent', className)} {...props} />
}

export { Skeleton }
