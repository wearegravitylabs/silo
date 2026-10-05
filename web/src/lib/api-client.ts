import { useAuthStore } from '@/stores/auth-store'

const BASE_URL = '/api/v1'

/** Error payload the API puts in `error` on every failure response. */
interface ApiErrorBody {
  id?: string
  service?: string
  code?: string
  message?: string
}

interface Envelope<T> {
  code: number
  data: T
  message: string | null
  error: ApiErrorBody | null
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly requestId?: string
  /** Client-safe message from the server, if it sent one. */
  readonly serverMessage?: string

  constructor(status: number, body?: ApiErrorBody | null) {
    super(body?.message || `Request failed: ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.code = body?.code
    this.requestId = body?.id
    this.serverMessage = body?.message || undefined
  }
}

/** Server-provided message when available, otherwise `fallback`. Null when there is no error. */
export function getErrorMessage(error: unknown, fallback: string): string | null {
  if (!error) return null
  return (error instanceof ApiError && error.serverMessage) || fallback
}

type Params = Record<string, string | number | boolean | null | undefined>

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Plain objects are sent as JSON; FormData is sent as multipart. */
  body?: unknown
  params?: Params
  signal?: AbortSignal
}

function buildUrl(path: string, params?: Params) {
  const url = BASE_URL + path
  if (!params) return url
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `${url}?${qs}` : url
}

async function send(path: string, options: RequestOptions, token: string | null) {
  const { method = 'GET', body, params, signal } = options
  const isForm = body instanceof FormData
  const headers: Record<string, string> = {}
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  return fetch(buildUrl(path, params), {
    method,
    headers,
    signal,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  })
}

// Concurrent 401s share one refresh request instead of each firing their own.
let refreshing: Promise<string | null> | null = null

function refreshAccessToken(): Promise<string | null> {
  refreshing ??= (async () => {
    const { refreshToken, setAccessToken, clearAuth } = useAuthStore.getState()
    if (!refreshToken) return null
    try {
      const res = await send('/auth/refresh-token', { method: 'POST', body: { refresh_token: refreshToken } }, null)
      if (!res.ok) throw new Error('refresh failed')
      const json = (await res.json()) as Envelope<{ access_token: string }>
      setAccessToken(json.data.access_token)
      return json.data.access_token
    } catch {
      clearAuth()
      return null
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

/**
 * Calls the Silo API and returns the unwrapped `data` payload.
 * Attaches the access token, and on a 401 refreshes it once and retries.
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res = await send(path, options, useAuthStore.getState().accessToken)

  if (res.status === 401 && !path.startsWith('/auth/')) {
    const token = await refreshAccessToken()
    if (token) res = await send(path, options, token)
  }

  const json = (await res.json().catch(() => null)) as Envelope<T> | null
  if (!res.ok || json?.error) throw new ApiError(res.status, json?.error)
  return json?.data as T
}
