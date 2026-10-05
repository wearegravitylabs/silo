import { api } from '@/lib/api-client'
import type { CreatePortfolioInput, Currency, Portfolio, UpdatePortfolioInput } from './types'

export const listPortfolios = () =>
  api<{ items: Portfolio[] | null }>('/portfolios').then((d) => d?.items ?? [])

export const createPortfolio = (data: CreatePortfolioInput) =>
  api<Portfolio>('/portfolios', { method: 'POST', body: data })

export const updatePortfolio = (id: string, data: UpdatePortfolioInput) =>
  api<Portfolio>(`/portfolios/${id}`, { method: 'PATCH', body: data })

export const listCurrencies = () => api<Currency[] | null>('/currencies').then((d) => d ?? [])
