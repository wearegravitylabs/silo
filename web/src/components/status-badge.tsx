import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const TONES = {
  success: 'border-success-light bg-success-subtle text-success',
  destructive: 'border-destructive-light bg-destructive-subtle text-destructive',
  neutral: 'border-line bg-accent text-foreground',
}

export type StatusTone = keyof typeof TONES

/** Small outlined status chip: green "Active"/"Paid", red "Overdue"/"Inactive", grey "Upcoming". */
export function StatusBadge({ tone, className, children }: { tone: StatusTone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn('inline-flex shrink-0 items-center rounded-md border px-1.5 text-xs leading-5 font-medium', TONES[tone], className)}
    >
      {children}
    </span>
  )
}
