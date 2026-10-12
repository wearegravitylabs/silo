import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SummaryRow {
  label: string
  value: ReactNode
  /** e.g. text-positive for returns, font-semibold for a total */
  valueClassName?: string
}

/** Titled label/value list on a grey card ("Asset Summary", "Debt Summary"). Long values truncate. */
export function SummaryList({ title, rows, className }: { title: string; rows: SummaryRow[]; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <h3 className="font-heading text-xl leading-7 font-bold">{title}</h3>
      <dl className="divide-y divide-line overflow-hidden rounded-2xl bg-accent">
        {rows.map((row) => (
          <div key={row.label} className="flex h-11.5 items-center justify-between gap-4 px-4">
            <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
            <dd className={cn('min-w-0 truncate font-medium', row.valueClassName)}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** Request failure shown under a sheet's submit button. */
export function SubmitError({ message }: { message: string }) {
  return (
    <p role="alert" className="border border-red-300 bg-negative-subtle px-3.5 py-2.5 text-negative">
      {message}
    </p>
  )
}
