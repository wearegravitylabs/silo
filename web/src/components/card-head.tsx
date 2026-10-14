import type { ReactNode } from 'react'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ExpandIcon } from '@/components/icons'

/**
 * Card title row (46px): icon + title (+ optional badge), expand affordance or custom content on the right.
 * `onExpand` makes the expand icon a button. `bordered` adds a divider below. On narrow screens the badge wraps under the title.
 */
export function CardHead({
  icon,
  title,
  badge,
  right,
  onExpand,
  bordered = true,
}: {
  icon: ReactNode
  title: string
  badge?: ReactNode
  right?: ReactNode
  onExpand?: () => void
  bordered?: boolean
}) {
  const expand = onExpand ? (
    <Tooltip content="Expand">
      <button
        type="button"
        onClick={onExpand}
        aria-label={`Expand ${title}`}
        className="-m-1 flex size-6 items-center justify-center rounded-md transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <ExpandIcon />
      </button>
    </Tooltip>
  ) : (
    <ExpandIcon />
  )

  return (
    <div className={cn('flex min-h-11.5 items-center justify-between gap-3 px-4 py-3', bordered && 'border-b')}>
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="flex items-center gap-2 font-sans leading-5.5 font-medium">
          {icon}
          {title}
        </h2>
        {badge}
      </div>
      {right ?? expand}
    </div>
  )
}
