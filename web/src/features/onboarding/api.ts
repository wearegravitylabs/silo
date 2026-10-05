import { api } from '@/lib/api-client'
import type { User } from '@/stores/auth-store'

export interface OnboardInput {
  first_name: string
  last_name: string
  phone_number: string
  phone_country_code: string
}

export const onboard = (data: OnboardInput) =>
  api<User>('/users/me/onboard', { method: 'PATCH', body: data })
