import { api } from '@/lib/api-client'
import type { NotificationChannels, OnboardInput, UpdateProfileInput, User, ViewerInviteAccess } from './types'

// The API ignores a null avatar_url, so a removed photo is saved as "" (read back here as none).
const toUser = (u: User): User => ({ ...u, avatar_url: u.avatar_url || null })

export const getMe = async () => toUser(await api<User>('/users/me'))

export const onboard = async (data: OnboardInput) => toUser(await api<User>('/users/me/onboard', { method: 'PATCH', body: data }))

export const updateProfile = async (data: UpdateProfileInput) => toUser(await api<User>('/users/me', { method: 'PATCH', body: data }))

const delay = (ms = 800) => new Promise((r) => setTimeout(r, ms))

// Mocks below return only the fields they change; useUserMutation merges them into the cached user.

// TODO: mocked. Real call: the billing/checkout endpoint once it exists.
/** Upgrade to Premium: ends the free trial (the sidebar's trial card becomes "What's New"). */
export const upgradePlan = async (): Promise<Partial<User>> => {
  await delay(1200)
  return { trial_days_left: null }
}

/** Uploads the photo to public storage, then points the profile at its URL. */
export const uploadAvatar = async (file: File) => {
  const form = new FormData()
  form.append('file', file)
  const { url } = await api<{ url: string }>('/upload', { method: 'POST', body: form })
  return updateProfile({ avatar_url: url })
}

// The file stays in storage: the API has no way to delete an upload yet.
export const removeAvatar = () => updateProfile({ avatar_url: '' })

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

// TODO: the design confirms with a code emailed to the user; the API has no code step yet, so it deletes straight away.
export const deleteAccount = () => api('/users/me', { method: 'DELETE' })

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
