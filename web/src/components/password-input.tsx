import { useState } from 'react'
import { EyeClosedIcon, EyeIcon } from 'lucide-react'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'

/** Password field with a show/hide toggle at the end. */
export function PasswordInput({ invalid, className, ...props }: Omit<React.ComponentProps<'input'>, 'type'> & { invalid?: boolean }) {
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeIcon : EyeClosedIcon

  return (
    <InputGroup invalid={invalid} className={className}>
      <InputGroupInput type={visible ? 'text' : 'password'} aria-invalid={invalid || undefined} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="mr-2 flex size-6 shrink-0 items-center justify-center rounded-md text-subtle transition-colors outline-none hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <Icon className="size-3.5" />
      </button>
    </InputGroup>
  )
}
