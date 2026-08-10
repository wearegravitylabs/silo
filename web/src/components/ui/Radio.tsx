import { type InputHTMLAttributes, useId } from 'react'
import { cn } from '@/lib/utils'

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  helper?: string
}

export function Radio({ label, helper, className, id, ...props }: RadioProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="flex flex-col gap-0.5">
      <label
        htmlFor={inputId}
        className="flex items-center gap-2.5 cursor-pointer select-none"
      >
        <div className="relative shrink-0">
          <input id={inputId} type="radio" className="peer sr-only" {...props} />
          <div
            className={cn(
              'size-[18px] rounded-full border-2 border-border bg-background transition-colors',
              'peer-checked:border-primary',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2',
              'peer-disabled:opacity-50',
              className,
            )}
          />
          <div className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-primary scale-0 peer-checked:scale-100 transition-transform pointer-events-none" />
        </div>
        {label && <span className="text-sm text-foreground">{label}</span>}
      </label>
      {helper && <p className="text-xs text-muted ml-7">{helper}</p>}
    </div>
  )
}
