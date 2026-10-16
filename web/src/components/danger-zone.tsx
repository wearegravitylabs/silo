import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** "DANGER ZONE" frame for irreversible actions: grey card with the label, holding one or more <DangerZoneItem>s. */
export function DangerZone({ className, children }: { className?: string; children: ReactNode }) {
  const labelId = useId()
  return (
    <section aria-labelledby={labelId} className={cn('flex flex-col rounded-xl border bg-surface', className)}>
      <h2 id={labelId} className="px-4 py-1.25 font-sans text-eyebrow">
        Danger Zone
      </h2>
      <div className="-mx-px -mb-px flex flex-col gap-0.5">{children}</div>
    </section>
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
