import { cn } from '@/lib/utils'

/**
 * Static grey row shown where list items will appear once there's data (not a loading pulse).
 * Matches the real rows' geometry: 40px avatar, two lines left, two lines right.
 */
export function PlaceholderRow({ className }: { className?: string }) {
  return (
    <li aria-hidden className={cn('flex items-center justify-between gap-3 py-4', className)}>
      <span className="flex min-w-0 items-center gap-3">
        <span className="size-10 shrink-0 rounded-full bg-accent" />
        <span className="flex flex-col gap-2">
          <span className="h-5 w-30 max-w-full rounded-md bg-accent" />
          <span className="h-3 w-22 rounded-sm bg-accent" />
        </span>
      </span>
      <span className="flex flex-col items-end gap-2">
        <span className="h-5 w-30 rounded-md bg-accent max-sm:w-20" />
        <span className="h-3 w-22 rounded-sm bg-accent max-sm:w-14" />
      </span>
    </li>
  )
}
