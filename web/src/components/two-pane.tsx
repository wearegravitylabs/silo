import type { ReactNode } from 'react'

/**
 * Sheet body: form on the left (white), summary on the right (surface), each centring a 400px column that
 * scrolls on its own. Below md the panes stack (form, then summary) and scroll together.
 */
export function TwoPane({ form, summary }: { form: ReactNode; summary: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
      <div className="flex justify-center bg-background px-4 py-8 md:flex-1 md:overflow-y-auto md:border-r md:border-border md:py-10">
        <div className="flex w-full max-w-100 flex-col gap-8">{form}</div>
      </div>
      <div className="flex flex-1 justify-center bg-surface px-4 py-8 md:overflow-y-auto md:py-10">
        <div className="flex w-full max-w-100 flex-col gap-5">{summary}</div>
      </div>
    </div>
  )
}
