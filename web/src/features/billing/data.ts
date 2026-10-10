// Plans and prices. Mock until billing exists.

export type BillingCycle = 'monthly' | 'yearly'

export const YEARLY_DISCOUNT = 0.2

/** Premium's monthly price in each currency the picker offers. */
export const PREMIUM_MONTHLY: Record<string, number> = {
  NGN: 28_000,
  USD: 19,
  EUR: 18,
  GBP: 15,
}

export const PREMIUM_FEATURES = [
  'Asset tracking and management',
  'Debt tracking and management',
  'Vault for Ultra-Sensitive documents',
  'Future Portfolio project up to 50 years forward',
  'Multi-Portfolio Management',
  'Invite up to 20 partners',
]

/** Price for the cycle: yearly is twelve months less the discount. */
export function premiumPrice(currency: string, cycle: BillingCycle) {
  const monthly = PREMIUM_MONTHLY[currency] ?? PREMIUM_MONTHLY.USD
  return cycle === 'monthly' ? monthly : Math.round(monthly * 12 * (1 - YEARLY_DISCOUNT))
}
