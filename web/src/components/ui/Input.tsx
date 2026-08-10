import { type InputHTMLAttributes, type ReactNode, useId } from 'react'
import { cn } from '@/lib/utils'

type InputSize = 'sm' | 'md'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  helper?: string
  error?: string
  size?: InputSize
  leftElement?: ReactNode
  rightElement?: ReactNode
}

export function Input({
  label,
  helper,
  error,
  size = 'md',
  leftElement,
  rightElement,
  className,
  id,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftElement && (
          <span className="absolute left-3.5 text-muted pointer-events-none">{leftElement}</span>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full bg-surface text-foreground placeholder:text-subtle outline-none transition-colors',
            size === 'sm' ? 'px-3.5 py-2 text-xs rounded-lg' : 'px-4 py-3 text-sm rounded-xl',
            leftElement && (size === 'sm' ? 'pl-9' : 'pl-10'),
            rightElement && (size === 'sm' ? 'pr-9' : 'pr-10'),
            error
              ? 'border-2 border-danger focus:border-danger'
              : 'border border-border focus:border-primary',
            props.disabled && 'opacity-50 cursor-not-allowed',
            className,
          )}
          {...props}
        />
        {rightElement && (
          <span className="absolute right-3.5 text-muted">{rightElement}</span>
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {helper && !error && <p className="text-xs text-muted">{helper}</p>}
    </div>
  )
}
