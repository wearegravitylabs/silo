import { cn } from '@/lib/utils'

/** White panel with the standard soft border-shadow. */
function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('overflow-hidden rounded-2xl bg-card text-card-foreground shadow-panel', className)} {...props} />
}

export { Card }
