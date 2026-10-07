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
    'disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] disabled:bg-line disabled:bg-none disabled:text-subtle disabled:opacity-100',
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

type ButtonProps = React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean; loading?: boolean }

/** `loading` shows a spinner and blocks clicks but keeps the variant's colours (unlike `disabled`). */
function Button({ className, variant, size, asChild = false, loading = false, type = 'button', children, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      data-slot="button"
      type={asChild ? undefined : type}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), loading && 'pointer-events-none', className)}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
          {children}
        </>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
