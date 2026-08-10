import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

const positionClasses: Record<TooltipPosition, { wrapper: string; arrow: string }> = {
  top: {
    wrapper: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    arrow:
      'top-full left-1/2 -translate-x-1/2 border-x-transparent border-b-transparent border-t-ink',
  },
  bottom: {
    wrapper: 'top-full left-1/2 -translate-x-1/2 mt-2',
    arrow:
      'bottom-full left-1/2 -translate-x-1/2 border-x-transparent border-t-transparent border-b-ink',
  },
  left: {
    wrapper: 'right-full top-1/2 -translate-y-1/2 mr-2',
    arrow:
      'left-full top-1/2 -translate-y-1/2 border-y-transparent border-r-transparent border-l-ink',
  },
  right: {
    wrapper: 'left-full top-1/2 -translate-y-1/2 ml-2',
    arrow:
      'right-full top-1/2 -translate-y-1/2 border-y-transparent border-l-transparent border-r-ink',
  },
}

interface TooltipProps {
  content: ReactNode
  position?: TooltipPosition
  children: ReactNode
  className?: string
}

export function Tooltip({ content, position = 'top', children, className }: TooltipProps) {
  const pos = positionClasses[position]

  return (
    <span className="group relative inline-flex">
      {children}
      <span className={cn('absolute z-50 pointer-events-none', pos.wrapper)}>
        <span
          className={cn(
            'invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-150',
            'inline-flex items-center justify-center px-2 py-1 rounded-lg',
            'bg-ink text-white text-xs font-medium whitespace-nowrap',
            className,
          )}
        >
          {content}
        </span>
        <span className={cn('absolute border-4 invisible group-hover:visible', pos.arrow)} />
      </span>
    </span>
  )
}
