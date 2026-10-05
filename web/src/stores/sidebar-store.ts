import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarState {
  collapsed: boolean
  toggle: () => void
}

/** App sidebar open/closed, remembered across reloads. */
export const useSidebarStore = create<SidebarState>()(
  persist((set) => ({ collapsed: false, toggle: () => set((s) => ({ collapsed: !s.collapsed })) }), { name: 'silo-sidebar' }),
)
