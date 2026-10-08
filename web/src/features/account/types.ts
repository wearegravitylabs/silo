export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone_number: string | null
  phone_country_code: string | null
  avatar_url: string | null
  is_email_verified: boolean
  is_onboarded: boolean
  portfolio_count: number
  /** Days left on the free trial; null when not on a trial (paid, or trial not started). */
  trial_days_left: number | null
  created_at: string
  updated_at: string
}

export interface OnboardInput {
  first_name: string
  last_name: string
  phone_number: string
  phone_country_code: string
}

export function getUserInitials(user: Pick<User, 'first_name' | 'last_name'> | null | undefined) {
  if (!user) return '?'
  return `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || '?'
}
