import * as React from 'react'
import { CheckIcon, MinusIcon } from 'lucide-react'
import { Checkbox as CheckboxPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

/** 16px checkbox: brand fill with ✓ when checked, − when `checked="indeterminate"` (e.g. Select All, some ticked). */
function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'peer flex size-4 shrink-0 items-center justify-center rounded-[0.25rem] border border-line bg-background transition-colors outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:border-primary-dark data-[state=checked]:bg-primary-dark data-[state=indeterminate]:border-primary-dark data-[state=indeterminate]:bg-primary-dark',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="group text-white">
        <CheckIcon className="size-3 group-data-[state=indeterminate]:hidden" strokeWidth={3} />
        <MinusIcon className="hidden size-3 group-data-[state=indeterminate]:block" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
