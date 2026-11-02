import { expireSession, getAccessToken, hasSession, refreshAccessToken } from './session'

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

/** The server's client-safe message for an error (or the connection message), or `fallback` for non-API failures. */
export function getErrorMessage(error: unknown, fallback: string): string {
  return (error instanceof ApiError && error.serverMessage) || fallback
}

// `code`s of the ApiError thrown when no answer came back: the device is offline, or the API is down or unreachable.
const OFFLINE = 'OFFLINE'
const UNREACHABLE = 'UNREACHABLE'

function connectionError() {
  return navigator.onLine
    ? new ApiError(0, { code: UNREACHABLE, message: 'Can’t reach Silo right now. Try again in a moment.' })
    : new ApiError(0, { code: OFFLINE, message: 'You’re offline. Check your connection and try again.' })
}

/** True when a request failed for want of a connection (offline, or the API is down), so retrying later can fix it. */
export function isConnectionError(error: unknown) {
  return error instanceof ApiError && (error.code === OFFLINE || error.code === UNREACHABLE)
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

async function send(path: string, options: RequestOptions) {
  const { method = 'GET', body, params, signal } = options
  const isForm = body instanceof FormData
  const headers: Record<string, string> = {}
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
  const token = getAccessToken()
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    return await fetch(buildUrl(path, params), {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
  } catch (err) {
    if (signal?.aborted) throw err
    throw connectionError()
  }
}

/** Calls the Silo API and returns the unwrapped `data` payload. Throws ApiError on failure. */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const isAuthCall = path.startsWith('/auth/')
  // After a reload only the refresh token is left: get an access token before the first call rather than after its 401.
  if (!isAuthCall && !getAccessToken() && hasSession()) await refreshAccessToken()

  let res = await send(path, options)
  if (res.status === 401 && !isAuthCall && hasSession()) {
    const refreshed = await refreshAccessToken()
    if (refreshed === 'ok') res = await send(path, options)
    // A refresh that got no answer says nothing about the session: keep it and report the connection instead.
    else if (refreshed === 'network') throw connectionError()
    else expireSession()
  }
  const json = (await res.json().catch(() => null)) as Envelope<T> | null
  // A 5xx without the API's envelope comes from the proxy in front of it: the API itself is down.
  if (!json && res.status >= 500) throw connectionError()
  if (!res.ok || json?.error) throw new ApiError(res.status, json?.error)
  return json?.data as T
}
