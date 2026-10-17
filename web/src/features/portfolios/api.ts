import type { CreatePortfolioInput, Currency, Invitation, Portfolio, UpdatePortfolioInput } from './types'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// TODO: mocked until the app runs against the backend. Real call:
// api<{ items: Portfolio[] | null }>('/portfolios').then((d) => d?.items ?? [])
const MOCK_PORTFOLIOS: Portfolio[] = [
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
    summary: { net_worth: 0, change_amount: 0, change_pct: 0 },
    created_at: now,
    updated_at: now,
  }
  MOCK_PORTFOLIOS.push(portfolio)
  return portfolio
}

const findPortfolio = (id: string) => {
  const portfolio = MOCK_PORTFOLIOS.find((p) => p.id === id)
  if (!portfolio) throw new Error('This portfolio no longer exists')
  return portfolio
}

// TODO: mocked. Real call: api<Portfolio>(`/portfolios/${id}`, { method: 'PATCH', body: data })
export const updatePortfolio = async (id: string, data: UpdatePortfolioInput): Promise<Portfolio> => {
  await delay(600)
  const portfolio = findPortfolio(id)
  Object.assign(portfolio, data, { updated_at: new Date().toISOString() })
  return { ...portfolio }
}

const removeMockPortfolio = (id: string) => {
  MOCK_PORTFOLIOS.splice(MOCK_PORTFOLIOS.indexOf(findPortfolio(id)), 1)
}

/** Emails the owner the code that confirms deleting a portfolio. */
// TODO: mocked. Real call: api(`/portfolios/${id}/deletion-code`, { method: 'POST' })
export const requestPortfolioDeletionCode = async (_id: string) => {
  await delay(400)
}

// TODO: mocked. Real call: api(`/portfolios/${id}`, { method: 'DELETE', body: { code } })
export const deletePortfolio = async ({ id }: { id: string; code: string }) => {
  await delay(800)
  removeMockPortfolio(id)
}

/** Stop being a partner of a portfolio; it stays for everyone else. */
// TODO: mocked. Real call: api(`/portfolios/${id}/members/${me.id}`, { method: 'DELETE' })
export const leavePortfolio = async (id: string) => {
  await delay(600)
  removeMockPortfolio(id)
}

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
