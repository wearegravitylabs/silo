import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ExpandIcon } from './icons'

/**
 * Card title row (46px): icon + title (+ optional badge), expand affordance or custom content on the right.
 * `bordered` adds a divider below. On narrow screens the badge wraps under the title.
 */
export function CardHead({
  icon,
  title,
  badge,
  right,
  bordered = true,
}: {
  icon: ReactNode
  title: string
  badge?: ReactNode
  right?: ReactNode
  bordered?: boolean
}) {
  return (
    <div className={cn('flex min-h-11.5 items-center justify-between gap-3 px-4 py-3', bordered && 'border-b')}>
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="flex items-center gap-2 font-sans leading-5.5 font-medium">
          {icon}
          {title}
        </h2>
        {badge}
      </div>
      {right ?? <ExpandIcon />}
    </div>
  )
}
