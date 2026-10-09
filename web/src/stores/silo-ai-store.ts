import { create } from 'zustand'

interface SiloAiPanelState {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

/** Whether the Silo AI panel is open. Shared so any part of the app (sidebar, cards, search) can open it. */
export const useSiloAiPanel = create<SiloAiPanelState>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}))
