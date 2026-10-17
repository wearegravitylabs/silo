import { cn } from '@/lib/utils'

/** Round avatar: the photo when there is one, otherwise the name's first initial. Size with className (default 32px). */
function Avatar({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  const base = 'flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full'
  if (src) return <img src={src} alt="" className={cn(base, 'object-cover', className)} />
  return (
    <span aria-hidden className={cn(base, 'border border-border bg-background font-medium text-foreground', className)}>
      {name.trim()[0]?.toUpperCase() ?? '?'}
    </span>
  )
}

export { Avatar }
