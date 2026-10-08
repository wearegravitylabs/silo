import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Section heading: small spaced-caps eyebrow, title, actions on the right (wrap under the title on narrow screens). */
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
    <div className={cn('flex flex-wrap items-end justify-between gap-x-4 gap-y-3 px-4 pt-7 md:px-10', className)}>
      <div className="flex min-w-0 flex-col gap-2">
        <span className="truncate text-[0.6875rem] leading-4 font-medium tracking-[0.0625rem] text-muted-foreground uppercase">
          {eyebrow}
        </span>
        {title}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
