import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Grey frame with a small caps label ("CURRENT PLAN", "DANGER ZONE") holding white cards, plus an optional note
 * under them ("Your free plan expires on 10 Apr, 2026").
 */
export function FramedCard({
  label,
  footer,
  className,
  children,
}: {
  label: string
  footer?: ReactNode
  className?: string
  children: ReactNode
}) {
  const labelId = useId()
  return (
    <section aria-labelledby={labelId} className={cn('flex flex-col rounded-xl border bg-surface', className)}>
      <h2 id={labelId} className="px-4 py-1.25 font-sans text-eyebrow">
        {label}
      </h2>
      <div className={cn('-mx-px flex flex-col gap-0.5', !footer && '-mb-px')}>{children}</div>
      {footer && <p className="px-4 py-1 text-xs leading-5">{footer}</p>}
    </section>
  )
}
