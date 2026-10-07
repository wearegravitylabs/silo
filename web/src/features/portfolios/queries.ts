import { queryOptions, useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createPortfolio, getInvite, getInviteLink, listCurrencies, listPortfolios, requestToJoin, updatePortfolio } from './api'
import type { UpdatePortfolioInput } from './types'

export const portfoliosQuery = queryOptions({ queryKey: ['portfolios'], queryFn: listPortfolios, staleTime: 5 * 60_000 })

export const currenciesQuery = queryOptions({ queryKey: ['currencies'], queryFn: listCurrencies, staleTime: Infinity })

/** All portfolios. Suspends — preload with `portfoliosQuery` in the route loader. */
export const usePortfolios = () => useSuspenseQuery(portfoliosQuery).data

/** One portfolio by id (from the URL). The route loader guarantees it exists. */
export const usePortfolio = (id: string) => {
  const portfolio = usePortfolios().find((p) => p.id === id)
  if (!portfolio) throw new Error(`Portfolio ${id} not found`)
  return portfolio
}

export const useCurrencies = () => useQuery(currenciesQuery)

export const useCreatePortfolio = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createPortfolio,
    onSuccess: () => qc.invalidateQueries({ queryKey: portfoliosQuery.queryKey }),
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

export const inviteQuery = (token: string) => queryOptions({ queryKey: ['invites', token], queryFn: () => getInvite(token) })

/** The invite behind a link token. Suspends — preload with `inviteQuery` in the route loader. */
export const useInvite = (token: string) => useSuspenseQuery(inviteQuery(token)).data

export const inviteLinkQuery = (portfolioId: string) =>
  queryOptions({ queryKey: ['portfolios', portfolioId, 'invite-link'], queryFn: () => getInviteLink(portfolioId) })

/** Shareable invite link for a portfolio. Suspends — preload with `inviteLinkQuery` in the route loader. */
export const useInviteLink = (portfolioId: string) => useSuspenseQuery(inviteLinkQuery(portfolioId)).data

export const useRequestToJoin = () => useMutation({ mutationFn: requestToJoin })
