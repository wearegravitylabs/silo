import { type InputHTMLAttributes, useId } from 'react'
import { cn } from '@/lib/utils'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  helper?: string
  error?: string
}

export function Checkbox({ label, helper, error, className, id, ...props }: CheckboxProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="flex items-start gap-2.5 cursor-pointer select-none group"
      >
        <div className="relative mt-0.5 shrink-0">
          <input id={inputId} type="checkbox" className="peer sr-only" {...props} />
          <div
            className={cn(
              'size-[18px] rounded border-2 border-border bg-background transition-colors',
              'peer-checked:bg-primary peer-checked:border-primary',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2',
              'peer-disabled:opacity-50',
              className,
            )}
          />
          <svg
            className="absolute inset-0 m-auto w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"
            viewBox="0 0 10 8"
            fill="none"
          >
            <path
              d="M1 4l3 3 5-6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {label && <span className="text-sm text-foreground leading-snug">{label}</span>}
      </label>
      {error && <p className="text-xs text-danger ml-7">{error}</p>}
      {helper && !error && <p className="text-xs text-muted ml-7">{helper}</p>}
    </div>
  )
}
