import type { OnboardInput, User } from './types'

// TODO: mocked until the app runs against the backend. Real call: api<User>('/users/me')
const MOCK_USER: User = {
  id: 'demo-user',
  email: 'john.doe@yahoo.com',
  first_name: 'John',
  last_name: 'Doe',
  phone_number: null,
  phone_country_code: null,
  avatar_url: null,
  is_email_verified: true,
  is_onboarded: true,
  portfolio_count: 1,
  trial_days_left: 14, // on a free trial until upgradePlan() — the sidebar shows the trial card
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}
export const getMe = () => Promise.resolve(MOCK_USER)

// TODO: mocked. Real call: api<User>('/users/me/onboard', { method: 'PATCH', body: data })
export const onboard = async (data: OnboardInput): Promise<User> => {
  await new Promise((r) => setTimeout(r, 800))
  Object.assign(MOCK_USER, data, { is_onboarded: true, updated_at: new Date().toISOString() })
  return { ...MOCK_USER }
}

// TODO: mocked. Real call: the billing/checkout endpoint once it exists.
/** Upgrade to Premium: ends the free trial (the sidebar's trial card becomes "What's New"). */
export const upgradePlan = async (): Promise<User> => {
  await new Promise((r) => setTimeout(r, 1200))
  MOCK_USER.trial_days_left = null
  return { ...MOCK_USER }
}
