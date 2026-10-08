import { api } from '@/lib/api-client'
import type { CreatePortfolioInput, Currency, Invitation, Portfolio, UpdatePortfolioInput } from './types'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// TODO: mocked until the app runs against the backend. Real call:
// api<{ items: Portfolio[] | null }>('/portfolios').then((d) => d?.items ?? [])
const MOCK_PORTFOLIOS: Portfolio[] = [
  {
    id: 'demo',
    user_id: 'demo-user',
    name: 'Retirement portfolio',
    description: '',
    base_currency: 'NGN',
    image_url: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
]
export const listPortfolios = () => Promise.resolve([...MOCK_PORTFOLIOS])

// TODO: mocked. Real call: api<Portfolio>('/portfolios', { method: 'POST', body: data })
export const createPortfolio = async (data: CreatePortfolioInput): Promise<Portfolio> => {
  await delay(800)
  const now = new Date().toISOString()
  const portfolio: Portfolio = {
    id: crypto.randomUUID(),
    user_id: 'demo-user',
    name: data.name,
    description: data.description ?? '',
    base_currency: data.base_currency,
    image_url: data.image_url ?? null,
    created_at: now,
    updated_at: now,
  }
  MOCK_PORTFOLIOS.push(portfolio)
  return portfolio
}

export const updatePortfolio = (id: string, data: UpdatePortfolioInput) =>
  api<Portfolio>(`/portfolios/${id}`, { method: 'PATCH', body: data })

// TODO: mocked. Real call: api<Currency[] | null>('/currencies').then((d) => d ?? [])
const MOCK_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
]
export const listCurrencies = () => Promise.resolve(MOCK_CURRENCIES)

// TODO: mocked until the backend has invitations. Expected endpoints:
// GET /portfolios/:id/invite-link, GET /invitations/:token, POST /invitations/:token/requests

/** Shareable link that starts the invited flow. Points at this app so the mock flow can be clicked through. */
export const getInviteLink = async (portfolioId: string): Promise<string> => {
  await delay(300)
  return `${window.location.origin}/invite/${portfolioId}`
}

export const getInvite = async (token: string): Promise<Invitation> => {
  await delay(300)
  return {
    token,
    portfolio: { id: token, name: 'Retirement portfolio', image_url: 'avatar:lime' },
    owner: { first_name: 'Daniel', last_name: 'Okafor', avatar_url: null },
  }
}

/** Ask the owner to let this user in. Access is granted only once they approve. */
export const requestToJoin = async (_token: string) => {
  await delay(800)
}
