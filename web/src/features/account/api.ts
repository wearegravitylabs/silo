import type { NotificationChannels, OnboardInput, UpdateProfileInput, User, ViewerInviteAccess } from './types'

// TODO: mocked until the app runs against the backend. Real call: api<User>('/users/me')
const MOCK_USER: User = {
  id: 'demo-user',
  email: 'john.doe@yahoo.com',
  first_name: 'John',
  last_name: 'Doe',
  phone_number: '0801 234 5678',
  phone_country_code: '+234',
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

const delay = (ms = 800) => new Promise((r) => setTimeout(r, ms))

/** Mock accounts that already exist, so Change Email can hit both outcomes. */
const EXISTING_EMAILS = new Set(['osonuga.daniel@gmail.com', 'taiwo.odetola@gmail.com', 'jane.doe@gmail.com'])

// TODO: mocked. Real call: api<User>('/users/me', { method: 'PATCH', body: data })
export const updateProfile = async (data: UpdateProfileInput): Promise<User> => {
  await delay()
  Object.assign(MOCK_USER, data, { updated_at: new Date().toISOString() })
  return { ...MOCK_USER }
}

// TODO: mocked. Real call: upload the file (POST /upload), then PATCH /users/me { avatar_url }.
export const uploadAvatar = async (file: File): Promise<User> => {
  await delay()
  if (MOCK_USER.avatar_url?.startsWith('blob:')) URL.revokeObjectURL(MOCK_USER.avatar_url)
  MOCK_USER.avatar_url = URL.createObjectURL(file)
  return { ...MOCK_USER }
}

// TODO: mocked. Real call: api<User>('/users/me', { method: 'PATCH', body: { avatar_url: null } })
export const removeAvatar = async (): Promise<User> => {
  await delay(400)
  if (MOCK_USER.avatar_url?.startsWith('blob:')) URL.revokeObjectURL(MOCK_USER.avatar_url)
  MOCK_USER.avatar_url = null
  return { ...MOCK_USER }
}

// TODO: mocked. Real call: api<{ exists: boolean }>('/users/email-check', { method: 'POST', body: { email } })
/** Whether another account already uses this email (an email can't move onto an existing account). */
export const checkEmail = async (email: string): Promise<{ exists: boolean }> => {
  await delay()
  return { exists: EXISTING_EMAILS.has(email.toLowerCase()) }
}

// TODO: mocked. Real call: api('/users/me/email', { method: 'POST', body: { email } })
/** Sends a verification link to the new address; the change applies once it's clicked. */
export const requestEmailChange = async (_email: string): Promise<void> => {
  await delay()
}

// TODO: mocked. Real call: api('/users/me/deletion-code', { method: 'POST' })
/** Emails a one-time code that confirms account deletion. */
export const requestDeletionCode = async (): Promise<void> => {
  await delay(400)
}

// TODO: mocked. Real call: api('/users/me', { method: 'DELETE', body: { code } })
export const deleteAccount = async (_code: string): Promise<void> => {
  await delay(1000)
}

const MOCK_CHANNELS: NotificationChannels = { email: true, in_app: true }

// TODO: mocked. Real call: api<NotificationChannels>('/users/me/notification-settings')
export const getNotificationChannels = () => Promise.resolve({ ...MOCK_CHANNELS })

// TODO: mocked. Real call: api<NotificationChannels>('/users/me/notification-settings', { method: 'PATCH', body: patch })
export const updateNotificationChannels = async (patch: Partial<NotificationChannels>): Promise<NotificationChannels> => {
  await delay(400)
  Object.assign(MOCK_CHANNELS, patch)
  return { ...MOCK_CHANNELS }
}

let MOCK_INVITE_ACCESS: ViewerInviteAccess = 'sign_up'

// TODO: mocked. Real call: api<{ viewer_invite_access: ViewerInviteAccess }>('/users/me/security-settings')
export const getViewerInviteAccess = () => Promise.resolve(MOCK_INVITE_ACCESS)

// TODO: mocked. Real call: api('/users/me/security-settings', { method: 'PATCH', body: { viewer_invite_access } })
export const updateViewerInviteAccess = async (access: ViewerInviteAccess): Promise<ViewerInviteAccess> => {
  await delay(400)
  MOCK_INVITE_ACCESS = access
  return access
}
