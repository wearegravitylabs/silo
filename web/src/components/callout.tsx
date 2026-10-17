import type { ReactNode } from 'react'
import { InfoIcon } from 'lucide-react'
import { AlertTriangleIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

const VARIANTS = {
  info: { box: 'bg-accent', title: 'text-foreground', body: 'text-muted-foreground', icon: 'fill-muted-foreground text-accent' },
  error: { box: 'bg-destructive-subtle', title: 'text-destructive', body: 'text-destructive', icon: 'text-destructive' },
  notice: { box: 'bg-info-subtle', title: 'text-info', body: 'text-info', icon: 'fill-info text-info-subtle' },
}

/**
 * Notice card: icon, title, optional supporting text ("Payoff Calculation"). `info` is grey, `error` pink with red
 * text, `notice` light blue with blue text ("Current Balance: $ 10,500.00"). A title-only callout centres its icon.
 */
export function Callout({
  variant = 'info',
  title,
  children,
  className,
}: {
  variant?: keyof typeof VARIANTS
  title: ReactNode
  children?: ReactNode
  className?: string
}) {
  const v = VARIANTS[variant]
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('flex animate-rise gap-3 rounded-xl px-4 py-3.5', !children && 'items-center', v.box, className)}
    >
      {variant === 'error' ? (
        <AlertTriangleIcon className={cn('size-4 shrink-0', children && 'mt-0.5', v.icon)} />
      ) : (
        <InfoIcon className={cn('size-4 shrink-0', children && 'mt-0.5', v.icon)} aria-hidden />
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <p className={cn('font-medium', v.title)}>{title}</p>
        {children && <div className={cn('text-xs leading-5', v.body)}>{children}</div>}
      </div>
    </div>
  )
}
