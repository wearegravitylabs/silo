import type { ReactNode } from 'react'
import { CloseIcon, DotsVerticalIcon } from '@/components/icons'
import { PanelTabs, type PanelTab } from '@/components/panel-layout'
import { Dialog, DialogClose, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { SheetContent } from '@/components/ui/sheet'

/**
 * Right-hand detail panel (asset, debt): ✕ and a ⋮ menu on top, then one scroller — the disc, title and properties
 * scroll away, the tab bar sticks, and the active tab (`children`) fills the rest; each tab's CTA sticks to the bottom.
 */
export function DetailPanel<T extends string>({
  open,
  onOpenChange,
  title,
  disc,
  menu,
  properties,
  tabs,
  tab,
  onTabChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** The round mark above the title */
  disc: ReactNode
  /** ⋮ menu items (DropdownMenuItem) */
  menu: ReactNode
  /** The PropertyList under the title */
  properties: ReactNode
  tabs: PanelTab<T>[]
  tab: T
  onTabChange: (tab: T) => void
  /** The active tab's content */
  children: ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" aria-describedby={undefined}>
        <div className="flex h-12 shrink-0 items-center justify-between px-4 sm:px-6">
          <DialogClose
            aria-label="Close panel"
            className="-ml-1 flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <CloseIcon />
          </DialogClose>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`${title} actions`}
              className="-mr-1 flex size-7 items-center justify-center rounded-lg outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40 aria-expanded:bg-accent"
            >
              <DotsVerticalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {menu}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="shrink-0 px-4 pt-3 pb-5 sm:px-6">
            {disc}
            <DialogTitle className="mt-4 mb-4 font-heading text-2xl leading-8 font-bold">{title}</DialogTitle>
            {properties}
          </div>

          <PanelTabs
            className="sticky top-0 z-10 bg-background"
            label={`${title} sections`}
            value={tab}
            onChange={onTabChange}
            tabs={tabs}
          />

          <div role="tabpanel" className="flex flex-1 flex-col">
            {children}
          </div>
        </div>
      </SheetContent>
    </Dialog>
  )
}
