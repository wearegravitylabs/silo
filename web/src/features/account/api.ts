import { api } from '@/lib/api-client'
import type { NotificationChannels, OnboardInput, UpdateProfileInput, User, ViewerInviteAccess } from './types'

export const getMe = () => api<User>('/users/me')

export const onboard = (data: OnboardInput) => api<User>('/users/me/onboard', { method: 'PATCH', body: data })

export const updateProfile = (data: UpdateProfileInput) => api<User>('/users/me', { method: 'PATCH', body: data })

const delay = (ms = 800) => new Promise((r) => setTimeout(r, ms))

// Mocks below return only the fields they change; useUserMutation merges them into the cached user.

// TODO: mocked. Real call: the billing/checkout endpoint once it exists.
/** Upgrade to Premium: ends the free trial (the sidebar's trial card becomes "What's New"). */
export const upgradePlan = async (): Promise<Partial<User>> => {
  await delay(1200)
  return { trial_days_left: null }
}

// TODO: mocked. Real call: upload the file (POST /upload), then PATCH /users/me { avatar_url }.
export const uploadAvatar = async (file: File): Promise<Partial<User>> => {
  await delay()
  return { avatar_url: URL.createObjectURL(file) }
}

// TODO: mocked. Real call: api<User>('/users/me', { method: 'PATCH', body: { avatar_url: null } })
export const removeAvatar = async (): Promise<Partial<User>> => {
  await delay(400)
  return { avatar_url: null }
}

/** Mock accounts that already exist, so Change Email can hit both outcomes. */
const EXISTING_EMAILS = new Set(['osonuga.daniel@gmail.com', 'taiwo.odetola@gmail.com', 'jane.doe@gmail.com'])

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
