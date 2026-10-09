import { useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkingLabel } from '../../types'

/** "Thinking… ⌄" with a light sweep through the text; expands to show the reasoning steps. */
export function WorkingStatus({ label, steps }: { label: WorkingLabel; steps: string[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-fit items-center gap-1 text-xs leading-5 text-muted-foreground"
      >
        <span className="animate-shimmer text-shimmer">{label}...</span>
        <ChevronDownIcon className={cn('size-3 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && steps.length > 0 && (
        <ol className="flex animate-rise flex-col gap-1 border-l border-border pl-3 text-xs leading-5 text-muted-foreground">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
    </div>
  )
}

/** Two sweeping grey bars standing in for the reply while the assistant works. */
export function ShimmerLines() {
  return (
    <div aria-hidden className="flex flex-col gap-2">
      <span className="h-3 w-[85%] animate-shimmer rounded-sm bg-shimmer" />
      <span className="h-3 w-[45%] animate-shimmer rounded-sm bg-shimmer" />
    </div>
  )
}
