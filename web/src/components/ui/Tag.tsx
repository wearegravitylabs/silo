import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type TagVariant = 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'info' | 'dark'
type TagSize = 'sm' | 'md'

const variantClasses: Record<TagVariant, string> = {
  default: 'bg-surface text-muted border border-border',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  danger: 'bg-danger-light text-danger',
  accent: 'bg-accent-faint text-foreground',
  info: 'bg-info-light text-primary-dark',
  dark: 'bg-dark text-white',
}

const sizeClasses: Record<TagSize, string> = {
  sm: 'px-2 py-0.5 text-[11px] rounded-md',
  md: 'px-2.5 py-1 text-xs rounded-lg',
}

interface TagProps {
  variant?: TagVariant
  size?: TagSize
  icon?: ReactNode
  onRemove?: () => void
  className?: string
  children: ReactNode
}

export function Tag({
  variant = 'default',
  size = 'md',
  icon,
  onRemove,
  className,
  children,
}: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {icon && <span className="shrink-0 leading-none">{icon}</span>}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 ml-0.5 hover:opacity-70 transition-opacity leading-none"
          aria-label="Remove"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M1.5 1.5l7 7M8.5 1.5l-7 7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </span>
  )
}
