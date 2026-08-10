import { type SelectHTMLAttributes, useId } from 'react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  helper?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
  size?: 'sm' | 'md'
}

export function Select({
  label,
  helper,
  error,
  options,
  placeholder,
  size = 'md',
  className,
  id,
  ...props
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            'w-full appearance-none bg-surface text-foreground outline-none transition-colors',
            size === 'sm'
              ? 'px-3.5 py-2 pr-9 text-xs rounded-lg'
              : 'px-4 py-3 pr-10 text-sm rounded-xl',
            error
              ? 'border-2 border-danger focus:border-danger'
              : 'border border-border focus:border-primary',
            props.disabled && 'opacity-50 cursor-not-allowed',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M3 5l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {helper && !error && <p className="text-xs text-muted">{helper}</p>}
    </div>
  )
}
