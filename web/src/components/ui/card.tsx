import { cn } from '@/lib/utils'

/** White panel with the standard small shadow (1px ring + soft drop). */
function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('overflow-hidden rounded-2xl bg-card text-card-foreground shadow-small', className)} {...props} />
}

export { Card }
