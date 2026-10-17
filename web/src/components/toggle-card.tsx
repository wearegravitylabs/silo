import { useId, type ReactNode } from 'react'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

/** Bordered row for an on/off setting: icon disc, title over a status line, switch on the right. */
export function ToggleCard({
  icon,
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
  className,
}: {
  icon: ReactNode
  title: string
  /** Under the title; defaults to "Enabled" / "Disabled" */
  description?: ReactNode
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn('flex items-center gap-3 rounded-xl border p-3', className)}>
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary-dark [&_svg]:size-3.5"
      >
        {icon}
      </span>
      <label htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1.5">
        <span className="truncate leading-5.5 font-medium">{title}</span>
        <span className="text-xs leading-5 text-muted-foreground">{description ?? (checked ? 'Enabled' : 'Disabled')}</span>
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} className="mr-1" />
    </div>
  )
}
