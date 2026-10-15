import { PencilIcon } from 'lucide-react'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'
import { cn } from '@/lib/utils'

/**
 * A value you can't type into, with a pencil that opens wherever it's changed (Change Email, Change Vault
 * Password). Looks like an input; the text is subtle.
 */
export function ReadOnlyField({
  id,
  value,
  placeholder,
  type,
  onEdit,
  editLabel,
  className,
}: {
  id?: string
  value: string
  /** Shown when there's no value ("Not set") */
  placeholder?: string
  type?: 'email' | 'password' | 'text'
  onEdit: () => void
  /** Screen-reader name for the pencil, e.g. "Change email address" */
  editLabel: string
  className?: string
}) {
  return (
    <InputGroup className={className}>
      <InputGroupInput
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        readOnly
        className={cn('cursor-default text-subtle', type === 'password' && 'tracking-widest')}
      />
      <button
        type="button"
        onClick={onEdit}
        aria-label={editLabel}
        className="mr-2 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
      >
        <PencilIcon className="size-3.5" />
      </button>
    </InputGroup>
  )
}
