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

/** The server's client-safe message for an error, or `fallback` (network errors, non-API failures). */
export function getErrorMessage(error: unknown, fallback: string): string {
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

async function send(path: string, options: RequestOptions) {
  const { method = 'GET', body, params, signal } = options
  const isForm = body instanceof FormData
  const headers: Record<string, string> = {}
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'

  return fetch(buildUrl(path, params), {
    method,
    headers,
    signal,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  })
}

/** Calls the Silo API and returns the unwrapped `data` payload. Throws ApiError on failure. */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await send(path, options)
  const json = (await res.json().catch(() => null)) as Envelope<T> | null
  if (!res.ok || json?.error) throw new ApiError(res.status, json?.error)
  return json?.data as T
}
