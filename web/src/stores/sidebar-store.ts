import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarState {
  collapsed: boolean // desktop: icon rail
  toggle: () => void
  mobileOpen: boolean // below lg: drawer
  setMobileOpen: (open: boolean) => void
}

/** App sidebar: desktop collapse (remembered across reloads) and the mobile drawer (not remembered). */
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      toggle: () => set((s) => ({ collapsed: !s.collapsed })),
      mobileOpen: false,
      setMobileOpen: (mobileOpen) => set({ mobileOpen }),
    }),
    { name: 'silo-sidebar', partialize: ({ collapsed }) => ({ collapsed }) },
  ),
)
