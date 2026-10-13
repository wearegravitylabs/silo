import * as React from 'react'
import { Select as SelectPrimitive } from 'radix-ui'
import { ChevronDownIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { floatingPanel } from './floating'

/** Single-choice select. Pair SelectTrigger (+ SelectValue placeholder) with SelectContent of SelectItems. */
const Select = SelectPrimitive.Root
const SelectValue = SelectPrimitive.Value
const SelectGroup = SelectPrimitive.Group

/** 40px field matching <Input>: surface fill, blue border while open or focused, red via aria-invalid. */
function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'group flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-border bg-surface px-4 text-left text-foreground transition-colors outline-none',
        'focus-visible:border-primary data-placeholder:text-subtle data-[state=open]:border-primary',
        'disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-2 aria-invalid:border-destructive',
        '[&>span]:truncate',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-3 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

/** Drops below the trigger at its exact width. */
function SelectContent({
  className,
  children,
  position = 'popper',
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        sideOffset={sideOffset}
        className={cn(
          'z-50 max-h-(--radix-select-content-available-height) overflow-hidden',
          floatingPanel,
          'origin-(--radix-select-content-transform-origin) data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          position === 'popper' && 'w-(--radix-select-trigger-width)',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="flex flex-col gap-0.5">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'flex cursor-pointer items-center rounded-lg px-3 py-1.5 leading-5.5 text-foreground outline-none select-none',
        'data-highlighted:bg-accent data-disabled:pointer-events-none data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

export { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue }
