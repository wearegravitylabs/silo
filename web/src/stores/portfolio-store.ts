import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PortfolioState {
  currentPortfolioId: string | null
  setCurrentPortfolioId: (id: string | null) => void
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      currentPortfolioId: null,
      setCurrentPortfolioId: (currentPortfolioId) => set({ currentPortfolioId }),
    }),
    { name: 'silo-portfolio' },
  ),
)

