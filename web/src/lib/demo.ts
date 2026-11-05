// Shared by every feature whose data is still partly mocked (features can't import each other).

/**
 * The sample portfolios behind the app's mock data (assets, debts, … are keyed to `demo`). They live in memory rather
 * than in the API, and are listed in dev builds only, for reference.
 */
const DEMO_PORTFOLIO_IDS = ['demo', 'family']

export const isDemoPortfolio = (portfolioId: string) => DEMO_PORTFOLIO_IDS.includes(portfolioId)
