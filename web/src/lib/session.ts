import { queryClient } from './query-client'

const REFRESH_KEY = 'silo-refresh-token'

export interface AuthTokens {
  access_token: string
  refresh_token: string
}

// The access token lives only in memory; the refresh token survives reloads.
let accessToken: string | null = null
let refreshing: Promise<boolean> | null = null
let expiredListener: (() => void) | null = null

function readRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_KEY)
  } catch {
    return null
  }
}

function writeRefreshToken(token: string | null) {
  try {
    if (token) localStorage.setItem(REFRESH_KEY, token)
    else localStorage.removeItem(REFRESH_KEY)
  } catch {
    // Storage blocked: the session lasts until the access token expires.
  }
}

export const getAccessToken = () => accessToken

/** True when the user signed in on this device and hasn't signed out (the tokens may still have expired). */
export const hasSession = () => !!accessToken || !!readRefreshToken()

export function setSession(tokens: AuthTokens) {
  accessToken = tokens.access_token
  writeRefreshToken(tokens.refresh_token)
}

export function clearSession() {
  accessToken = null
  writeRefreshToken(null)
}

/** Ends the session on this device and drops every cached query. The API has no logout endpoint. */
export function signOut() {
  clearSession()
  queryClient.clear()
}

/** Called when the session can't be refreshed any more, e.g. to send the user to /login. */
export function onSessionExpired(listener: () => void) {
  expiredListener = listener
}

export function expireSession() {
  signOut()
  expiredListener?.()
}

/** Swaps the refresh token for a new access token. Concurrent callers share one request. */
export function refreshAccessToken(): Promise<boolean> {
  const refreshToken = readRefreshToken()
  if (!refreshToken) return Promise.resolve(false)
  refreshing ??= fetch('/api/v1/auth/refresh-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
    .then(async (res) => {
      const json = (await res.json().catch(() => null)) as { data?: { access_token?: string } } | null
      const token = res.ok ? json?.data?.access_token : undefined
      if (token) accessToken = token
      return !!token
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}
