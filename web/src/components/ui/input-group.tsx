import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Field shell for an input with something attached (currency picker, "%", a unit): looks exactly like <Input> —
 * 40px, surface fill, blue border on focus, 2px red border when `invalid`.
 */
function InputGroup({ className, invalid, ...props }: React.ComponentProps<'div'> & { invalid?: boolean }) {
  return (
    <div
      data-invalid={invalid || undefined}
      className={cn(
        'flex h-10 w-full min-w-0 items-center overflow-hidden rounded-xl bg-surface transition-colors',
        invalid ? 'border-2 border-destructive' : 'border border-border focus-within:border-primary',
        className,
      )}
      {...props}
    />
  )
}

/** Leading slot: plain text ("%") or a control (currency menu). */
function InputGroupAddon({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex h-full shrink-0 items-center pl-4 text-foreground', className)} {...props} />
}

/** The bare input inside a group; the group draws the border. */
function InputGroupInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-full min-w-0 flex-1 bg-transparent px-4 text-foreground outline-none placeholder:text-subtle disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { InputGroup, InputGroupAddon, InputGroupInput }
