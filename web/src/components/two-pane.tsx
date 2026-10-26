import type { ReactNode } from 'react'

/**
 * Sheet body: form on the left (white), summary on the right (surface), each centring a 400px column that
 * scrolls on its own. Below md the panes stack (form, then summary) and scroll together. The vertical padding sits on
 * the columns, not the scrolling panes, so the last field keeps its space above the sheet's footer.
 */
export function TwoPane({ form, summary }: { form: ReactNode; summary: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
      <div className="flex justify-center bg-background px-4 md:flex-1 md:overflow-y-auto md:border-r md:border-border">
        <div className="flex h-fit w-full max-w-100 flex-col gap-8 py-8 md:py-10">{form}</div>
      </div>
      <div className="flex flex-1 justify-center bg-surface px-4 md:overflow-y-auto">
        <div className="flex h-fit w-full max-w-100 flex-col gap-5 py-8 md:py-10">{summary}</div>
      </div>
    </div>
  )
}
