import { api } from '@/lib/api-client'
import type { OnboardInput, User } from './types'

// TODO: mocked until the app runs against the backend. Real call: api<User>('/users/me')
const MOCK_USER: User = {
  id: 'demo-user',
  email: 'demo@silo.app',
  first_name: 'Demo',
  last_name: 'User',
  phone_number: null,
  phone_country_code: null,
  avatar_url: null,
  is_email_verified: true,
  is_onboarded: true,
  portfolio_count: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}
export const getMe = () => Promise.resolve(MOCK_USER)

export const onboard = (data: OnboardInput) => api<User>('/users/me/onboard', { method: 'PATCH', body: data })
