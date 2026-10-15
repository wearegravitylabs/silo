import * as React from 'react'
import { Select as SelectPrimitive } from 'radix-ui'
import { ChevronDownIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { floatingPanel } from './floating'

/** Single-choice select. Pair SelectTrigger (+ SelectValue placeholder) with SelectContent of SelectItems. */
const Select = SelectPrimitive.Root
const SelectValue = SelectPrimitive.Value
const SelectGroup = SelectPrimitive.Group

/**
 * 40px field matching <Input>: surface fill, blue border while open or focused, red via aria-invalid.
 * `icon` replaces the turning chevron (e.g. a calendar for a year field).
 */
function SelectTrigger({
  className,
  children,
  icon,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & { icon?: React.ReactNode }) {
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
        {icon ?? (
          <ChevronDownIcon className="size-3 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        )}
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

// Long lists scroll; these chevrons show there's more above or below.
const scrollButton = 'flex h-4 shrink-0 cursor-default items-center justify-center text-muted-foreground'

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
        <SelectPrimitive.ScrollUpButton className={scrollButton}>
          <ChevronDownIcon className="size-2.5 rotate-180" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="flex flex-col gap-0.5">{children}</SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className={scrollButton}>
          <ChevronDownIcon className="size-2.5" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

/**
 * One option. `icon` and `description` show in the list only — the trigger shows just the label
 * ("Viewer", not "👁 Viewer / View-only access").
 */
function SelectItem({
  className,
  children,
  icon,
  description,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item> & { icon?: React.ReactNode; description?: React.ReactNode }) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'flex cursor-pointer items-center rounded-lg px-3 py-1.5 leading-5.5 text-foreground outline-none select-none',
        'data-highlighted:bg-accent data-disabled:pointer-events-none data-disabled:opacity-50',
        (icon || description) && 'grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1 py-2',
        className,
      )}
      {...props}
    >
      {icon && <span className="flex text-muted-foreground [&_svg]:size-4">{icon}</span>}
      <span className={cn(!icon && description && 'col-span-2')}>
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      </span>
      {description && <span className="col-start-2 text-xs leading-5 text-muted-foreground">{description}</span>}
    </SelectPrimitive.Item>
  )
}

export { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue }
