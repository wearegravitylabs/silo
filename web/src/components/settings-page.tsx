import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * A settings page: centred 544px column with title + description, then the page's sections. `wide` spans the
 * panel instead (tables: Partners). The column fills the scroll area, so a trailing <UnsavedChangesBar> sits at its bottom.
 */
export function SettingsPage({
  title,
  description,
  wide = false,
  children,
}: {
  title: string
  description: string
  wide?: boolean
  children?: ReactNode
}) {
  return (
    <div className={cn('mx-auto flex w-full flex-1 flex-col px-4 pt-8 pb-6 md:pt-17 md:pb-24', wide ? 'md:px-10' : 'max-w-136 sm:px-0')}>
      <header className="mb-10 flex flex-col gap-1.5">
        <h1 className="font-sans text-xl leading-7 font-semibold tracking-normal">{title}</h1>
        <p className="text-xs leading-5">{description}</p>
      </header>
      {children}
    </div>
  )
}
