import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** "DANGER ZONE" card for an irreversible action: grey frame with the label, white card with title, warning, action. */
export function DangerZone({
  title,
  description,
  action,
  className,
}: {
  title: string
  description: ReactNode
  action: ReactNode
  className?: string
}) {
  const labelId = useId()
  return (
    <section aria-labelledby={labelId} className={cn('flex flex-col rounded-xl border bg-surface', className)}>
      <h2 id={labelId} className="px-4 py-1.25 font-sans text-eyebrow">
        Danger Zone
      </h2>
      <div className="-mx-px -mb-px flex flex-col items-start gap-1.5 rounded-xl border bg-background p-4">
        <h3 className="font-sans text-sm leading-5.5 font-medium">{title}</h3>
        <p className="text-xs leading-5">{description}</p>
        <div className="mt-2.5">{action}</div>
      </div>
    </section>
  )
}
