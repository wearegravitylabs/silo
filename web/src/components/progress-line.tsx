import { cn } from '@/lib/utils'

/** Thin brand line along the foot of a sheet header showing how far through a flow you are (`value` 0–1). */
export function ProgressLine({ value, label, className }: { value: number; label: string; className?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-0.5 w-full shrink-0 bg-border', className)}
    >
      <div className="h-full bg-primary-dark transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
    </div>
  )
}
