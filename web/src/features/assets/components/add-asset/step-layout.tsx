import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Two-pane step: form on the left (white), summary on the right (surface). Each pane centres a 400px column. */
export function TwoPane({ form, summary }: { form: ReactNode; summary: ReactNode }) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 justify-center overflow-y-auto border-r bg-background py-10">
        <div className="flex w-100 flex-col gap-8">{form}</div>
      </div>
      <div className="flex flex-1 justify-center overflow-y-auto bg-surface py-10">
        <div className="flex w-100 flex-col gap-5">{summary}</div>
      </div>
    </div>
  )
}

export interface SummaryRow {
  label: string
  value: ReactNode
  /** e.g. text-positive for returns */
  valueClassName?: string
}

/** Label/value list on a grey card ("Stock preview", "Asset Summary"). */
export function SummaryList({ title, rows }: { title: string; rows: SummaryRow[] }) {
  return (
    <>
      <h3 className="font-heading text-xl leading-7 font-bold">{title}</h3>
      <dl className="divide-y divide-line overflow-hidden rounded-2xl bg-accent">
        {rows.map((row) => (
          <div key={row.label} className="flex h-11.5 items-center justify-between px-4">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className={cn('font-medium', row.valueClassName)}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </>
  )
}

export function SubmitError({ message }: { message: string }) {
  return (
    <p role="alert" className="border border-red-300 bg-negative-subtle px-3.5 py-2.5 text-negative">
      {message}
    </p>
  )
}
