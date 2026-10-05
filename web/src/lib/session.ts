import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/stores/auth-store'
import { usePortfolioStore } from '@/stores/portfolio-store'

/** Clears tokens, the selected portfolio and all cached server data. */
export function endSession() {
  useAuthStore.getState().clearAuth()
  usePortfolioStore.getState().setCurrentPortfolioId(null)
  queryClient.clear()
}
