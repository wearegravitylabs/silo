// The rule catalogue behind Add New Rule: each template is a sentence of text and blanks ("slots").
// Slot values are stored as text; `source` names the option list a choice slot picks from.

export type SlotKind = 'percent' | 'money' | 'number' | 'year' | 'date' | 'choice'

export type OptionSource =
  | 'category' // value_change targets
  | 'asset_type'
  | 'asset' // the portfolio's assets (from the route)
  | 'debt_scope' // all debts, or one debt (from the route)
  | 'fee_scope' // the whole portfolio, or one asset
  | 'frequency'
  | 'duration_unit'
  | 'expense_category'

export interface Slot {
  key: string
  kind: SlotKind
  /** Shown while empty: "X%", "$X", "time frame" */
  placeholder: string
  source?: OptionSource
  /** Percent slots that may go below zero ("Debts to change by -2%") */
  signed?: boolean
  /** Joined to the value once filled ("8% per year"); stays plain text while empty */
  suffix?: string
}

export type Part = string | Slot

export type RuleTab = 'growth' | 'debt' | 'income' | 'spending' | 'settings'

export interface RuleTemplate {
  tab: RuleTab
  /** Eyebrow on the template card ("PORTFOLIO WIDE GROWTH"); none in Portfolio Settings */
  section?: string
  parts: Part[]
}

const pct = (key = 'rate', extra?: Partial<Slot>): Slot => ({ key, kind: 'percent', placeholder: 'X%', ...extra })
const money = (key = 'amount'): Slot => ({ key, kind: 'money', placeholder: '$X' })
const choice = (key: string, source: OptionSource, placeholder: string): Slot => ({ key, kind: 'choice', source, placeholder })
const date = (key = 'date'): Slot => ({ key, kind: 'date', placeholder: 'date' })
const frequency = (placeholder = 'frequency') => choice('frequency', 'frequency', placeholder)

export const RULE_TEMPLATES = {
  // The default scenario's rules (not offered in Add New Rule)
  value_change: {
    tab: 'growth',
    parts: ['Value of ', choice('target', 'category', 'category'), ' to change by ', pct('rate', { signed: true, suffix: ' per year' })],
  },

  portfolio_growth: { tab: 'growth', section: 'Portfolio Wide Growth', parts: ['All assets grow at ', pct(), ' annually'] },
  asset_type_growth: {
    tab: 'growth',
    section: 'By Asset Type',
    parts: [choice('asset_type', 'asset_type', 'This asset type'), ' appreciate at ', pct(), ' ', frequency('time frame')],
  },
  asset_growth: {
    tab: 'growth',
    section: 'Individual Asset',
    parts: [choice('asset', 'asset', 'Specific asset'), ' grows at ', pct(), ' ', frequency('time frame')],
  },
  target_value: {
    tab: 'growth',
    section: 'Target Value',
    parts: [choice('asset', 'asset', 'Asset'), ' reaches ', money('target'), ' by ', { key: 'year', kind: 'year', placeholder: 'year' }],
  },

  interest_accrual: {
    tab: 'debt',
    section: 'Interest Accrual',
    parts: [pct(), ' annual interest on ', choice('debt', 'debt_scope', 'all debts / specific debt')],
  },
  regular_payment: {
    tab: 'debt',
    section: 'Regular Payments',
    parts: ['Pay ', money(), ' ', frequency('time frame'), ' starting ', date()],
  },
  accelerated_payoff: { tab: 'debt', section: 'Accelerated Payoff', parts: ['Pay ', pct(), ' of total debt annually'] },
  debt_free_goal: {
    tab: 'debt',
    section: 'Debt-Free Goal',
    parts: [
      'Eliminate all debt within ',
      { key: 'count', kind: 'number', placeholder: 'X' },
      ' ',
      choice('unit', 'duration_unit', 'months / year'),
    ],
  },

  employment_income: {
    tab: 'income',
    section: 'Employment Income',
    parts: [
      money(),
      ' ',
      frequency(),
      ', increases ',
      pct('raise'),
      ' annually until age ',
      { key: 'age', kind: 'number', placeholder: 'X' },
    ],
  },
  asset_income: {
    tab: 'income',
    section: 'Asset-Generated Income',
    parts: [money(), ' ', frequency(), ' from ', choice('asset', 'asset', 'asset')],
  },
  one_time_income: { tab: 'income', section: 'One-Time Events', parts: [money(), ' expected ', date()] },
  future_income: { tab: 'income', section: 'Future Income', parts: [money(), ' ', frequency(), ' starting ', date()] },

  regular_expense: {
    tab: 'spending',
    section: 'Regular Expenses',
    parts: [money(), ' ', frequency(), ' for ', choice('category', 'expense_category', 'category')],
  },
  asset_cost: {
    tab: 'spending',
    section: 'Asset Costs',
    parts: [money(), ' ', frequency(), ' for ', choice('asset', 'asset', 'asset'), ' upkeep'],
  },
  management_fee: {
    tab: 'spending',
    section: 'Management Fees',
    parts: [pct(), ' of ', choice('scope', 'fee_scope', 'portfolio/asset'), ' annually'],
  },
  planned_purchase: { tab: 'spending', section: 'Planned Purchases', parts: [money(), ' by ', date()] },
  future_obligation: { tab: 'spending', section: 'Future Obligations', parts: [money(), ' ', frequency(), ' starting ', date()] },

  inflation: { tab: 'settings', parts: ['Inflation rate is ', pct('rate', { suffix: ' per year' })] },
} satisfies Record<string, RuleTemplate>

export type RuleTemplateId = keyof typeof RULE_TEMPLATES

export const RULE_TABS: { id: RuleTab; label: string; description?: string }[] = [
  { id: 'growth', label: 'Growth', description: 'How your assets will grow over time' },
  { id: 'debt', label: 'Debt', description: 'How your debts will change' },
  { id: 'income', label: 'Income Streams', description: 'Money coming in' },
  { id: 'spending', label: 'Spending', description: 'Money going out' },
  { id: 'settings', label: 'Portfolio Settings' },
]

/** Templates offered per tab, in the design's order (value_change is only for the defaults). */
export const templatesFor = (tab: RuleTab) =>
  (Object.keys(RULE_TEMPLATES) as RuleTemplateId[]).filter((id) => id !== 'value_change' && RULE_TEMPLATES[id].tab === tab)

export const slotsOf = (id: RuleTemplateId) => (RULE_TEMPLATES[id].parts as Part[]).filter((p): p is Slot => typeof p !== 'string')
