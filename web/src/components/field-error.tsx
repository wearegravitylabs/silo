import { AlertTriangleIcon } from '@/components/icons'

/** Inline validation/API message under a field. Announced to screen readers. */
export function FieldError({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive">
      <AlertTriangleIcon className="size-3.25" />
      {message}
    </p>
  )
}
