import type { ReactNode } from 'react'
import { FramedCard } from '@/components/framed-card'
import { cn } from '@/lib/utils'

/** "DANGER ZONE" frame for irreversible actions, holding one or more <DangerZoneItem>s. */
export function DangerZone({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <FramedCard label="Danger Zone" className={className}>
      {children}
    </FramedCard>
  )
}

/**
 * One action in a <DangerZone>: white card with title, warning and button. `stacked` puts the button underneath
 * (Delete Account); `inline` puts it on the right, dropping below when there's no room. `disabled` fades the text.
 */
export function DangerZoneItem({
  title,
  description,
  action,
  layout = 'stacked',
  disabled = false,
}: {
  title: string
  description: ReactNode
  action: ReactNode
  layout?: 'stacked' | 'inline'
  disabled?: boolean
}) {
  const text = (
    <div className={cn('flex min-w-0 flex-col gap-1.5', disabled && 'text-subtle')}>
      <h3 className={cn('font-sans text-sm leading-5.5 font-medium', disabled && 'text-subtle')}>{title}</h3>
      <p className={cn('text-xs leading-5', disabled && 'text-subtle')}>{description}</p>
    </div>
  )

  if (layout === 'inline') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl border bg-background p-4">
        {text}
        {action}
      </div>
    )
  }
  return (
    <div className="flex flex-col items-start gap-1.5 rounded-xl border bg-background p-4">
      {text}
      <div className="mt-2.5">{action}</div>
    </div>
  )
}
