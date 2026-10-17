import * as React from 'react'
import { Switch as SwitchPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

/** 24×16 toggle: white with a grey outline when off, brand blue when on. */
function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'peer inline-flex h-4 w-6 shrink-0 items-center rounded-full border border-line bg-background p-px transition-colors outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:border-primary-dark data-[state=checked]:bg-primary-dark',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-3 rounded-full bg-white shadow-small transition-transform duration-200 data-[state=checked]:translate-x-2" />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
