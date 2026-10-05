import { cn } from '@/lib/utils'

/** Step indicator: the current step is a lime pill, the rest are grey dots. */
export function ProgressDots({ steps, current }: { steps: number; current: number /* 1-indexed */ }) {
  return (
    <div className="flex items-center gap-1 rounded-2xl bg-background p-1" role="img" aria-label={`Step ${current} of ${steps}`}>
      {Array.from({ length: steps }, (_, i) => (
        <div
          key={i}
          className={cn('h-2 rounded-full transition-all duration-300', i + 1 === current ? 'w-4 bg-highlight' : 'w-2 bg-line')}
        />
      ))}
    </div>
  )
}
