import * as React from 'react'
import { cn } from '@/lib/utils'

/** Silo text field: 40px, surface fill, primary focus border, danger border via aria-invalid. */
function Input({ className, type = 'text', ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'h-10 w-full min-w-0 rounded-xl border border-border bg-surface px-4 text-sm text-foreground transition-colors outline-none',
        'placeholder:text-subtle focus:border-primary disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-2 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
