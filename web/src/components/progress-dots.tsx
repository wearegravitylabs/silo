import { cn } from '@/lib/utils'

const SIZES = {
  md: { dot: 'h-2', on: 'w-4', off: 'w-2' }, // onboarding header
  sm: { dot: 'h-1.5', on: 'w-3', off: 'w-1.5' }, // modal footers
}

/** Step indicator: the current step is a lime pill, the rest are grey dots. */
export function ProgressDots({
  steps,
  current,
  size = 'md',
  className,
}: {
  steps: number
  current: number /* 1-indexed */
  size?: keyof typeof SIZES
  className?: string
}) {
  const s = SIZES[size]
  return (
    <div
      className={cn('flex items-center gap-1 rounded-2xl bg-background p-1', className)}
      role="img"
      aria-label={`Step ${current} of ${steps}`}
    >
      {Array.from({ length: steps }, (_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-full transition-all duration-300',
            s.dot,
            i + 1 === current ? cn(s.on, 'bg-highlight') : cn(s.off, 'bg-line'),
          )}
        />
      ))}
    </div>
  )
}
