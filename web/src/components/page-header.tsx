import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Section heading: small caps eyebrow, title, actions on the right. */
export function PageHeader({
  eyebrow,
  title,
  actions,
  className,
}: {
  eyebrow: string
  title: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-end justify-between px-10 pt-7', className)}>
      <div className="flex flex-col gap-1">
        <span className="text-2xs font-medium tracking-caps text-muted-foreground uppercase">{eyebrow}</span>
        {title}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
