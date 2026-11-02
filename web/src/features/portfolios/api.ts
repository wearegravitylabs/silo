import { api } from '@/lib/api-client'
import type { CreatePortfolioInput, Currency, Invitation, Portfolio, UpdatePortfolioInput } from './types'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Sample portfolios kept for reference: the rest of the app's mock data (assets, debts, …) is keyed to `demo`. Listed in
// dev builds only, after the user's real portfolios.
const DEMO_PORTFOLIOS: Portfolio[] = [
  {
    id: 'demo',
    user_id: 'demo-user',
    name: 'Retirement',
    description: '',
    base_currency: 'NGN',
    image_url: 'avatar:lime',
    summary: { net_worth: 1_000_000, change_amount: 1_000, change_pct: 12 },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  // Shared with the demo user by someone else: they're a partner, not the owner.
  {
    id: 'family',
    user_id: 'daniel',
    name: 'Family Savings',
    description: '',
    base_currency: 'USD',
    image_url: 'avatar:green',
    summary: { net_worth: 250_000, change_amount: 4_000, change_pct: 1.6 },
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
  },
]

/** True for the sample portfolios (dev only), which live in memory rather than in the API. */
export const isDemoPortfolio = (id: string) => DEMO_PORTFOLIOS.some((p) => p.id === id)

export const listPortfolios = async () => {
  const page = await api<{ items: Portfolio[] | null }>('/portfolios', { params: { size: 100 } })
  const portfolios = page?.items ?? []
  return import.meta.env.DEV ? [...portfolios, ...DEMO_PORTFOLIOS] : portfolios
}

export const createPortfolio = (data: CreatePortfolioInput) => api<Portfolio>('/portfolios', { method: 'POST', body: data })

const findPortfolio = (id: string) => {
  const portfolio = DEMO_PORTFOLIOS.find((p) => p.id === id)
  if (!portfolio) throw new Error('This portfolio no longer exists')
  return portfolio
}

export const updatePortfolio = async (id: string, data: UpdatePortfolioInput): Promise<Portfolio> => {
  if (!isDemoPortfolio(id)) return api<Portfolio>(`/portfolios/${id}`, { method: 'PATCH', body: data })
  await delay(600)
  const portfolio = findPortfolio(id)
  Object.assign(portfolio, data, { updated_at: new Date().toISOString() })
  return { ...portfolio }
}

// Delete and leave are mocked, so they only work on the demo portfolios; a real one fails with the usual error toast.
const removeMockPortfolio = (id: string) => {
  DEMO_PORTFOLIOS.splice(DEMO_PORTFOLIOS.indexOf(findPortfolio(id)), 1)
}

/** Emails the owner the code that confirms deleting a portfolio. */
// TODO: mocked until the backend has deletion codes. Real call: api(`/portfolios/${id}/deletion-code`, { method: 'POST' })
export const requestPortfolioDeletionCode = async (_id: string) => {
  await delay(400)
}

// TODO: mocked. Real call: api(`/portfolios/${id}`, { method: 'DELETE', body: { code } })
export const deletePortfolio = async ({ id }: { id: string; code: string }) => {
  await delay(800)
  removeMockPortfolio(id)
}

/** Stop being a partner of a portfolio; it stays for everyone else. */
// TODO: mocked until partners can leave (removing a member is owner-only). Real call: api(`/portfolios/${id}/members/${me.id}`, { method: 'DELETE' })
export const leavePortfolio = async (id: string) => {
  await delay(600)
  removeMockPortfolio(id)
}

export const listCurrencies = () => api<Currency[] | null>('/currencies').then((d) => d ?? [])

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
