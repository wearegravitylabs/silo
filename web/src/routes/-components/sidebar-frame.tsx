import { useEffect, type ReactNode } from 'react'
import { useLocation } from '@tanstack/react-router'
import { MenuIcon, PanelLeftIcon, XIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/stores/sidebar-store'

// Shared by the portfolio and settings sidebars: the collapsible column, its mobile drawer and its nav-item look.

/**
 * Desktop: sticky column that collapses to an icon rail. Below lg: a drawer opened by <SidebarMenuButton>.
 * `children` renders the content for either place. `className` styles the desktop column (e.g. h-full).
 */
export function SidebarFrame({
  className,
  children,
}: {
  className?: string
  children: (state: { collapsed: boolean; drawer: boolean }) => ReactNode
}) {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebarStore()
  const { pathname } = useLocation()

  // Navigating from the drawer should close it.
  useEffect(() => setMobileOpen(false), [pathname, setMobileOpen])

  return (
    <>
      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 overflow-hidden bg-surface transition-[width] duration-200 ease-in-out lg:flex',
          collapsed ? 'w-16' : 'w-67',
          className,
        )}
      >
        {children({ collapsed, drawer: false })}
      </aside>

      <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40 lg:hidden data-open:animate-in data-open:fade-in-0" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-y-0 left-0 z-50 flex w-67 max-w-[85vw] animate-drawer-in bg-surface shadow-sheet outline-none lg:hidden"
          >
            <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
            {children({ collapsed: false, drawer: true })}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  )
}

/** Header button that opens the sidebar drawer. Only shown below lg, where the sidebar is hidden. */
export function SidebarMenuButton() {
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen)
  return (
    <button
      type="button"
      aria-label="Open navigation"
      onClick={() => setMobileOpen(true)}
      className="-ml-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
    >
      <MenuIcon className="size-4.5" />
    </button>
  )
}

const toggleButton = 'text-muted-foreground transition-opacity hover:opacity-60'

/** Top-row control: ✕ in the drawer, collapse on the desktop column, nothing on the rail (see <SidebarExpandButton>). */
export function SidebarHeaderToggle({ collapsed, drawer }: { collapsed: boolean; drawer: boolean }) {
  const toggle = useSidebarStore((s) => s.toggle)
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen)

  if (drawer) {
    return (
      <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation" className={toggleButton}>
        <XIcon className="size-4" />
      </button>
    )
  }
  if (collapsed) return null
  return (
    <button type="button" onClick={toggle} aria-label="Collapse sidebar" className={toggleButton}>
      <PanelLeftIcon className="size-4" />
    </button>
  )
}

/** On the icon rail: the button that widens the sidebar again. */
export function SidebarExpandButton() {
  const toggle = useSidebarStore((s) => s.toggle)
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Expand sidebar"
      className="mx-auto flex h-8 w-10 items-center justify-center rounded-lg text-muted-foreground transition-opacity hover:opacity-60"
    >
      <PanelLeftIcon className="size-4 rotate-180" />
    </button>
  )
}

/** A sidebar row (link or button): icon + label, grey until active (`data-status=active` from <Link>). */
export const navItemClass = (collapsed: boolean) =>
  cn(
    'flex h-8 items-center rounded-lg leading-5.5 font-medium transition-colors',
    'text-muted-foreground hover:bg-accent/60 data-[status=active]:bg-accent [&_svg]:size-4 data-[status=active]:[&_svg]:text-foreground',
    'focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none',
    collapsed ? 'mx-auto w-10 justify-center p-1.25' : 'w-full gap-1 px-2 py-1.25',
  )

/** The label beside a nav item's icon; hidden on the rail. */
export function NavLabel({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  return collapsed ? null : <span className="truncate pl-1 text-foreground">{children}</span>
}
