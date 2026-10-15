import type { ReactNode } from 'react'

/**
 * A settings page: centred 544px column with title + description, then the page's sections. The column fills
 * the scroll area, so a trailing <UnsavedChangesBar> sits at its bottom.
 */
export function SettingsPage({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-136 flex-1 flex-col px-4 pt-8 pb-6 sm:px-0 md:pt-17 md:pb-24">
      <header className="mb-10 flex flex-col gap-1.5">
        <h1 className="font-sans text-xl leading-7 font-semibold tracking-normal">{title}</h1>
        <p className="text-xs leading-5">{description}</p>
      </header>
      {children}
    </div>
  )
}
