// Temporary random dashboard data, used by api.ts until the dashboard is wired to the backend.
import type { DashboardAllocItem, DashboardDebt, DashboardInsight, DashboardMover, DashboardPeriod, DashboardResponse } from './types'

const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime()
const DAYS: Record<DashboardPeriod, number> = {
  '1D': 1,
  '1M': 30,
  '3M': 90,
  YTD: Math.max(1, Math.round((Date.now() - startOfYear) / 86_400_000)),
  '1Y': 365,
  All: 3 * 365,
}
const CURRENCY = 'NGN' // matches the design mock; the real API returns the portfolio's base currency
const CHART_POINTS = 30

const random = (min: number, max: number) => Math.round(min + Math.random() * (max - min))

// Mirrors the design's numbers.
const ALLOCATION: DashboardResponse['allocation'] = {
  by_type: [
    { key: 'stock', label: 'Stock', pct: 40, count: 6 },
    { key: 'crypto', label: 'Crypto', pct: 30, count: 4 },
    { key: 'real_estate', label: 'Real Estate', pct: 20, count: 2 },
    { key: 'other', label: 'Others', pct: 10, count: 1 },
  ] satisfies DashboardAllocItem[],
  by_currency: [
    { key: 'NGN', label: 'Naira (NGN)', pct: 75, count: 8 },
    { key: 'USD', label: 'Dollar (USD)', pct: 20, count: 3 },
    { key: 'EUR', label: 'Euro (EUR)', pct: 5, count: 1 },
    { key: 'GBP', label: 'Pounds (GBP)', pct: 0, count: 0 },
  ],
  by_folder: [
    { key: 'f1', label: 'Investment', pct: 80, count: 9 },
    { key: 'f2', label: 'Gambling', pct: 20, count: 4 },
  ],
}

const INSIGHTS: DashboardInsight[] = [
  {
    id: 'i1',
    title: 'Mixed Tech Signals & A Net Worth Milestone',
    sections: [
      {
        lead: 'The Big Picture',
        text: "You've hit the **₦1,000,000.00** milestone! Your portfolio is trending nicely with ++12%++ growth over the last month. Your diversification is currently protecting you—while your USD assets are volatile today, your NGN holdings (like Spotify) remain green.",
      },
      {
        lead: 'Market Movers (Volatility Alert)',
        text: 'The US Tech sector is giving mixed signals today. Apple and Nvidia are pulling back while Microsoft holds steady, so expect some swings in your USD holdings this week.',
      },
    ],
  },
  {
    id: 'i2',
    title: 'Cash Is Piling Up',
    sections: [
      {
        lead: 'Idle money',
        text: 'About **8%** of your portfolio is sitting in cash. Moving part of it into your savings folder could earn ++4–6%++ a year without adding much risk.',
      },
    ],
  },
  {
    id: 'i3',
    title: 'Naira Strength This Week',
    sections: [
      {
        lead: 'Currency watch',
        text: 'The naira gained ++1.4%++ against the dollar this week, lifting the value of your NGN assets relative to your USD holdings.',
      },
    ],
  },
  {
    id: 'i4',
    title: 'Mortgage Paydown On Track',
    sections: [
      {
        lead: 'Debts',
        text: 'Your mortgage balance dropped by **₦45,000.00** this month. At this pace you will clear it about ++8 months++ ahead of schedule.',
      },
    ],
  },
  {
    id: 'i5',
    title: 'Crypto Is Your Smallest Slice',
    sections: [
      {
        lead: 'Allocation',
        text: 'Crypto makes up **3%** of your assets. That keeps your exposure to its swings small while still giving you some upside.',
      },
    ],
  },
]

const mover = (
  asset_id: string,
  name: string,
  ticker: string,
  currency: string,
  current_value: number,
  change_amount: number,
  change_pct: number,
): DashboardMover => ({
  asset_id,
  name,
  ticker,
  asset_type: 'stock',
  currency,
  current_value,
  change_amount,
  change_pct,
})

const MOVERS: DashboardResponse['top_movers'] = {
  gainers: [
    mover('a1', 'Alphabet Inc.', 'GOOGL', 'USD', 1_000, 129, 12.5),
    mover('a2', 'Microsoft Corp.', 'MSFT', 'USD', 515.25, 95, 8.9),
    mover('a3', 'Spotify', 'SPOT', 'NGN', 100_000, 25_000, 7.5),
  ],
  losers: [
    mover('a4', 'Tiktok', 'TIKTOK', 'USD', 3_000, -1_029, -25),
    mover('a5', 'Netflix', 'NTFX', 'USD', 1_250.5, -850, -18.5),
    mover('a6', 'Solana', 'SOL', 'USD', 100.5, -50, -8.15),
  ],
}

const DEBT_ITEMS: DashboardDebt[] = [
  {
    debt_id: 'd1',
    name: 'Student Loan',
    debt_type: 'student_loan',
    scheduled: true,
    balance: 100_000,
    currency: CURRENCY,
    monthly_payment: 5_000,
    interest_rate: 0,
  },
  {
    debt_id: 'd2',
    name: 'Mortgage',
    debt_type: 'mortgage',
    scheduled: true,
    balance: 50_000,
    currency: CURRENCY,
    monthly_payment: 5_000,
    interest_rate: 6.5,
  },
  {
    debt_id: 'd3',
    name: 'Car Loan',
    debt_type: 'auto_loan',
    scheduled: true,
    balance: 50_000,
    currency: CURRENCY,
    monthly_payment: 5_000,
    interest_rate: 8.5,
  },
  {
    debt_id: 'd4',
    name: 'Loan from Sarah',
    debt_type: 'personal',
    scheduled: false,
    balance: 50_000,
    currency: CURRENCY,
    monthly_payment: null,
    interest_rate: null,
  },
]

function debtSummary(items: DashboardDebt[], interestPaidYtd: number, debtFreeDate: string | null): DashboardResponse['debts'] {
  const sum = (list: DashboardDebt[]) => list.reduce((total, d) => total + d.balance, 0)
  const scheduled = items.filter((d) => d.scheduled)
  return {
    summary: {
      total: sum(items),
      scheduled_total: sum(scheduled),
      unscheduled_total: sum(items.filter((d) => !d.scheduled)),
      monthly_payments: scheduled.reduce((total, d) => total + (d.monthly_payment ?? 0), 0),
      interest_paid_ytd: interestPaidYtd,
      currency: CURRENCY,
      debt_free_date: debtFreeDate,
    },
    items,
  }
}

export function mockDashboard(period: DashboardPeriod): DashboardResponse {
  const debts = debtSummary(DEBT_ITEMS, 50_000, '2038-01-01')
  const assets = random(1_200_000, 1_300_000)
  const totalDebts = debts.summary.total
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
    value *= 1 + (Math.random() - 0.5) * 0.06 // wavy, like the design
  }

  const changeAmount = netWorth - points[0].value

  return {
    data_status: 'ready',
    net_worth: {
      total: netWorth,
      assets,
      debts: totalDebts,
      currency: CURRENCY,
      change_amount: changeAmount,
      change_pct: (changeAmount / points[0].value) * 100,
      by_currency: [
        { currency: 'NGN', value: Math.round(assets * 0.5) },
        { currency: 'USD', value: random(800, 1_500) },
        { currency: 'EUR', value: random(200, 600) },
      ],
    },
    chart: { period, points },
    allocation: ALLOCATION,
    top_movers: MOVERS,
    debts,
    insights: INSIGHTS,
    last_synced_at: new Date().toISOString(),
  }
}

/** A portfolio with nothing in it yet: zeros everywhere, so every card shows its placeholder state. */
export function emptyDashboard(period: DashboardPeriod): DashboardResponse {
  const zero = (key: string, label: string) => ({ key, label, pct: 0, count: 0 })
  return {
    data_status: 'empty',
    net_worth: {
      total: 0,
      assets: 0,
      debts: 0,
      currency: CURRENCY,
      change_amount: 0,
      change_pct: 0,
      by_currency: ['NGN', 'USD', 'EUR'].map((currency) => ({ currency, value: 0 })),
    },
    chart: { period, points: [] },
    allocation: {
      by_type: [zero('stock', 'Stock'), zero('crypto', 'Crypto'), zero('real_estate', 'Real Estate'), zero('other', 'Others')],
      by_currency: [zero('NGN', 'Naira (NGN)'), zero('USD', 'Dollar (USD)'), zero('EUR', 'Euro (EUR)'), zero('GBP', 'Pounds (GBP)')],
      by_folder: [],
    },
    top_movers: { gainers: [], losers: [] },
    debts: debtSummary([], 0, null),
    insights: [],
    last_synced_at: new Date().toISOString(),
  }
}
