/** Chart periods shared by every money-over-time chart, and how a change line describes each ("Past Month"). */
export const CHART_PERIODS = [
  { label: '1D', description: 'Past Day' },
  { label: '1M', description: 'Past Month' },
  { label: '3M', description: 'Past 3 Months' },
  { label: 'YTD', description: 'Year to Date' },
  { label: '1Y', description: 'Past Year' },
  { label: 'All', description: 'All Time' },
] as const

export type ChartPeriod = (typeof CHART_PERIODS)[number]['label']

const startOfYear = () => new Date(new Date().getFullYear(), 0, 1).getTime()

/** How many days a period spans (YTD up to today; All taken as three years). */
export const periodDays = (period: ChartPeriod): number =>
  ({
    '1D': 1,
    '1M': 30,
    '3M': 90,
    YTD: Math.max(1, Math.round((Date.now() - startOfYear()) / 86_400_000)),
    '1Y': 365,
    All: 3 * 365,
  })[period]
