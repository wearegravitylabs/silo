import { CopyIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/** Small icon button that copies `value` and confirms with a toast ("Link copied"). */
export function CopyButton({
  value,
  label = 'Copy link',
  copiedMessage = 'Link copied',
  className,
}: {
  value: string
  /** Screen-reader name */
  label?: string
  copiedMessage?: string
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() =>
        navigator.clipboard
          .writeText(value)
          .then(() => toast.success(copiedMessage))
          .catch(() => toast.error('Couldn’t copy. Try again.'))
      }
      className={cn(
        'inline-flex size-4 shrink-0 items-center justify-center rounded-sm text-primary-dark transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none',
        className,
      )}
    >
      <CopyIcon className="size-3" aria-hidden />
    </button>
  )
}
