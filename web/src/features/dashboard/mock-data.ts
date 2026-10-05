// Temporary random dashboard data, used by api.ts until the dashboard is wired to the backend.
import type { DashboardAllocItem, DashboardDebt, DashboardMover, DashboardPeriod, DashboardResponse } from './types'

const DAYS: Record<DashboardPeriod, number> = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }
const CHART_POINTS = 30

const random = (min: number, max: number) => Math.round(min + Math.random() * (max - min))

function withPercentages(items: { label: string; value: number }[]): DashboardAllocItem[] {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  return items.map((item) => ({ ...item, pct: Math.round((item.value / total) * 100) }))
}

function mover(id: string, name: string, ticker: string, changePct: number): DashboardMover {
  const value = random(2_000, 40_000)
  return {
    asset_id: id,
    name,
    ticker,
    asset_type: 'stock',
    current_value: value,
    change_amount: Math.round((value * changePct) / 100),
    change_pct: changePct,
  }
}

function debt(id: string, name: string, type: string, balance: number): DashboardDebt {
  return {
    debt_id: id,
    name,
    debt_type: type,
    balance,
    owned_balance: balance,
    currency: 'USD',
    change_amount: -random(100, 1_500),
    change_pct: -Math.random() * 2,
  }
}

export function mockDashboard(period: DashboardPeriod): DashboardResponse {
  const debts = [
    debt('d1', 'Home mortgage', 'mortgage', random(180_000, 250_000)),
    debt('d2', 'Car loan', 'auto_loan', random(8_000, 20_000)),
  ]
  const assetAllocation = withPercentages([
    { label: 'Stocks', value: random(150_000, 300_000) },
    { label: 'Real Estate', value: random(300_000, 450_000) },
    { label: 'Cash', value: random(20_000, 60_000) },
    { label: 'Crypto', value: random(5_000, 30_000) },
  ])

  const assets = assetAllocation.reduce((sum, item) => sum + item.value, 0)
  const totalDebts = debts.reduce((sum, d) => sum + d.balance, 0)
  const netWorth = assets - totalDebts

  // Random walk ending at today's net worth, spread over the selected period.
  const stepDays = DAYS[period] / (CHART_POINTS - 1)
  const points = Array.from({ length: CHART_POINTS }, (_, i) => ({
    date: new Date(Date.now() - (CHART_POINTS - 1 - i) * stepDays * 86_400_000).toISOString().slice(0, 10),
    value: 0,
  }))
  let value = netWorth
  for (let i = points.length - 1; i >= 0; i--) {
    points[i].value = Math.round(value)
    value *= 1 + (Math.random() - 0.55) * 0.02
  }

  const changeAmount = netWorth - points[0].value

  return {
    data_status: 'ready',
    net_worth: {
      total: netWorth,
      assets,
      debts: totalDebts,
      currency: 'USD',
      change_amount: changeAmount,
      change_pct: (changeAmount / points[0].value) * 100,
    },
    chart: { period, points },
    allocation: {
      assets: assetAllocation,
      debts: withPercentages(debts.map((d) => ({ label: d.name, value: d.balance }))),
    },
    top_movers: {
      gainers: [mover('a1', 'Apple', 'AAPL', 4.2), mover('a2', 'Nvidia', 'NVDA', 3.1), mover('a3', 'Microsoft', 'MSFT', 1.8)],
      losers: [mover('a4', 'Tesla', 'TSLA', -3.6), mover('a5', 'Amazon', 'AMZN', -1.4)],
    },
    debts,
    last_synced_at: new Date().toISOString(),
  }
}
