import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usePortfolioStore } from '@/stores/portfolio-store'
import { createPortfolio, listCurrencies, listPortfolios, updatePortfolio } from './api'
import type { UpdatePortfolioInput } from './types'

export const portfolioKeys = {
  all: ['portfolios'] as const,
  currencies: ['currencies'] as const,
}

/** Shared by the hook and the router (which preloads it before the app shell renders). */
export const portfoliosQuery = queryOptions({ queryKey: portfolioKeys.all, queryFn: listPortfolios, staleTime: 5 * 60_000 })

export const usePortfolios = () => useQuery(portfoliosQuery)

/** The selected portfolio, falling back to the first one when nothing (or a stale id) is selected. */
export const useCurrentPortfolio = () => {
  const currentId = usePortfolioStore((s) => s.currentPortfolioId)
  const query = usePortfolios()
  const portfolios = query.data ?? []
  const portfolio = portfolios.find((p) => p.id === currentId) ?? portfolios[0] ?? null
  return { ...query, portfolio }
}

export const useCurrencies = () =>
  useQuery({ queryKey: portfolioKeys.currencies, queryFn: listCurrencies, staleTime: Infinity })

export const useCreatePortfolio = () => {
  const qc = useQueryClient()
  const select = usePortfolioStore((s) => s.setCurrentPortfolioId)
  return useMutation({
    mutationFn: createPortfolio,
    onSuccess: (portfolio) => {
      select(portfolio.id)
      qc.invalidateQueries({ queryKey: portfolioKeys.all })
    },
  })
}

export const useUpdatePortfolio = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdatePortfolioInput) => updatePortfolio(id, data),
    // Base currency changes every converted value, so refetch everything.
    onSuccess: () => qc.invalidateQueries(),
  })
}
