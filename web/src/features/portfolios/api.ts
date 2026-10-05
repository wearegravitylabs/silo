import { api } from '@/lib/api-client'
import type { CreatePortfolioInput, Currency, Portfolio, UpdatePortfolioInput } from './types'

// TODO: mocked until the app runs against the backend. Real call:
// api<{ items: Portfolio[] | null }>('/portfolios').then((d) => d?.items ?? [])
const MOCK_PORTFOLIOS: Portfolio[] = [
  {
    id: 'demo',
    user_id: 'demo-user',
    name: 'Personal',
    description: '',
    base_currency: 'USD',
    image_url: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
]
export const listPortfolios = () => Promise.resolve(MOCK_PORTFOLIOS)

export const createPortfolio = (data: CreatePortfolioInput) => api<Portfolio>('/portfolios', { method: 'POST', body: data })

export const updatePortfolio = (id: string, data: UpdatePortfolioInput) =>
  api<Portfolio>(`/portfolios/${id}`, { method: 'PATCH', body: data })

export const listCurrencies = () => api<Currency[] | null>('/currencies').then((d) => d ?? [])
