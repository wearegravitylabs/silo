import { cn } from '@/lib/utils'

/**
 * Onboarding progress indicator — white pill container with step dots.
 * Active step: 16×8px lime pill (#BBE03B). Inactive: 8×8px gray circles.
 * Matches Figma "Frame 27" from Onboarding-34.
 */
export function ProgressDots({
  steps,
  current,
}: {
  steps: number
  current: number // 1-indexed
}) {
  return (
    <div
      className="flex items-center bg-white rounded-2xl"
      style={{ gap: '4px', padding: '4px' }}
    >
      {Array.from({ length: steps }, (_, i) => (
        <div
          key={i}
          className={cn('rounded-full transition-all duration-300', {
            'bg-accent': i + 1 === current,
            'bg-[#E3E5ED]': i + 1 !== current,
          })}
          style={
            i + 1 === current
              ? { width: '16px', height: '8px' }
              : { width: '8px', height: '8px' }
          }
        />
      ))}
    </div>
  )
}
