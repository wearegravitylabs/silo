import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** A setting's title and one-line explanation ("Accent Colour / Choose your accent colour"). */
export function SettingHeading({
  title,
  description,
  badge,
  id,
}: {
  title: string
  description: string
  /** Small chip after the title ("Soon") */
  badge?: ReactNode
  id?: string
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <h2 id={id} className="flex flex-wrap items-center gap-1.5 font-sans text-sm leading-5.5 font-medium tracking-normal">
        {title}
        {badge && (
          <span className="rounded-md border border-line bg-accent px-1.5 text-xs leading-5 font-medium text-foreground">{badge}</span>
        )}
      </h2>
      <p className="leading-5.5">{description}</p>
    </div>
  )
}

/** Heading on the left, its control on the right; the control drops underneath when there's no room. */
export function SettingRow({
  title,
  description,
  id,
  className,
  children,
}: {
  title: string
  description: string
  id?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-x-6 gap-y-3', className)}>
      <SettingHeading title={title} description={description} id={id} />
      {children}
    </div>
  )
}
