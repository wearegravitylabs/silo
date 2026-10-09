import { AiSparkleIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

/** Silo AI's mark: the sparkle on a soft peach disc. Size with className (default 24px). */
export function AiAvatar({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn('flex size-6 shrink-0 items-center justify-center rounded-full bg-ai-soft', className)}>
      <AiSparkleIcon className="size-[55%]" />
    </span>
  )
}
