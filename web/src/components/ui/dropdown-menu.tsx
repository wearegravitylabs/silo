import * as React from 'react'
import { CheckIcon, ChevronRightIcon } from 'lucide-react'
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'
import { floatingPanel } from './floating'
import { usePreviewMode } from './preview-mode'

/** Menu root. Non-modal inside <PreviewMode> (dev galleries). */
function DropdownMenu(props: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  const preview = usePreviewMode()
  return <DropdownMenuPrimitive.Root modal={!preview} {...props} />
}
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

function DropdownMenuContent({
  className,
  align = 'start',
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 flex min-w-36 flex-col gap-0.5',
          floatingPanel,
          'origin-(--radix-dropdown-menu-content-transform-origin) data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuItem({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & { variant?: 'default' | 'destructive' }) {
  return (
    <DropdownMenuPrimitive.Item
      data-variant={variant}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.25 leading-5.5 outline-none select-none',
        'text-foreground focus:bg-accent data-disabled:pointer-events-none data-disabled:opacity-50',
        'data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive-subtle',
        '[&_svg]:shrink-0 [&_svg]:text-muted-foreground data-[variant=destructive]:[&_svg]:text-destructive',
        className,
      )}
      {...props}
    />
  )
}

/**
 * Row with a 16px checkbox (same look as <Checkbox>) for multi-select menus. Ticking keeps the menu open;
 * a ticked row is tinted grey.
 */
function DropdownMenuCheckboxItem({
  className,
  children,
  onSelect,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      onSelect={(e) => {
        e.preventDefault()
        onSelect?.(e)
      }}
      className={cn(
        'group flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.75 leading-5.5 text-foreground outline-none select-none',
        'focus:bg-accent data-[state=checked]:bg-accent data-disabled:pointer-events-none data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className="flex size-4 shrink-0 items-center justify-center rounded-[0.25rem] border border-line bg-background text-white transition-colors group-data-[state=checked]:border-primary-dark group-data-[state=checked]:bg-primary-dark"
      >
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-3" strokeWidth={3} />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return <DropdownMenuPrimitive.Separator className={cn('mx-2.5 my-0.5 h-px bg-border', className)} {...props} />
}

/** Nested menu: a row that opens a second panel beside it (e.g. Move Folders → the folder list). */
const DropdownMenuSub = DropdownMenuPrimitive.Sub

function DropdownMenuSubTrigger({ className, children, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger>) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.25 leading-5.5 text-foreground outline-none select-none',
        'focus:bg-accent data-[state=open]:bg-accent data-disabled:pointer-events-none data-disabled:opacity-50',
        '[&_svg]:shrink-0 [&_svg]:text-muted-foreground',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-3.5" aria-hidden />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.SubContent
        sideOffset={sideOffset}
        className={cn(
          'z-50 flex min-w-36 flex-col gap-0.5',
          floatingPanel,
          'origin-(--radix-dropdown-menu-content-transform-origin) data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
}
