import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2Icon } from 'lucide-react'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-1.5 font-semibold whitespace-nowrap',
    'transition-[opacity,transform,background-color,color] duration-150 outline-none select-none',
    'focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1',
    // While loading the button is disabled but keeps its normal look (not-aria-busy skips the dimmed styles).
    'disabled:pointer-events-none not-aria-busy:disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] disabled:opacity-100 not-aria-busy:disabled:bg-line not-aria-busy:disabled:bg-none not-aria-busy:disabled:text-subtle',
        secondary: 'bg-gradient-secondary text-foreground shadow-button hover:opacity-80 active:scale-[0.98]',
        destructive: 'bg-gradient-destructive text-primary-foreground hover:opacity-90 active:scale-[0.98]',
        outline: 'border border-accent bg-background font-medium text-muted-foreground hover:bg-surface',
        ghost: 'text-muted-foreground hover:bg-accent hover:text-foreground aria-expanded:bg-accent',
        link: 'h-auto px-0 text-primary-dark hover:opacity-70',
      },
      size: {
        xs: 'h-7 rounded-md px-2.5 text-xs',
        sm: 'h-8 rounded-lg px-3',
        md: 'h-10 px-4',
        lg: 'h-10 rounded-xl px-4',
        'icon-xs': 'size-6 rounded-md',
        'icon-sm': 'size-7 rounded-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'sm' },
  },
)

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean; loading?: boolean; loadingText?: React.ReactNode }

/**
 * `loading` is the one pending pattern for every button: spinner + `loadingText` (or the normal label).
 * It disables the button — no clicks, no Enter-key form submits — but keeps the variant's colours.
 */
function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingText,
  disabled,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      data-slot="button"
      type={asChild ? undefined : type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {asChild ? (
        children
      ) : loading ? (
        <>
          <Loader2Icon className="size-[1.2em] animate-spin" aria-hidden />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
