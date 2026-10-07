import type { ReactNode } from 'react'
import { FieldError } from '@/components/field-error'
import { cn } from '@/lib/utils'

/** Label + control + hint/error, the standard vertical form row. */
export function FormField({
  label,
  htmlFor,
  required,
  hint,
  error,
  className,
  children,
}: {
  label: ReactNode
  htmlFor?: string
  required?: boolean
  hint?: ReactNode
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={htmlFor} className="font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {error ? <FieldError message={error} /> : hint}
    </div>
  )
}

/** Centred page title + supporting line, used on auth and onboarding screens. */
export function FormHeading({ title, subtitle, className }: { title: string; subtitle: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-3 text-center', className)}>
      <h1 className="text-h6">{title}</h1>
      <p>{subtitle}</p>
    </div>
  )
}
