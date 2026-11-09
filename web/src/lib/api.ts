// Where API calls go. Unset VITE_API_URL keeps them same-origin (/api/v1, proxied by Vite in dev and by the host's
// rewrite in production); set at build time, it points at the API's own host (cross-origin, so the API needs CORS).

/**
 * The API's origin from VITE_API_URL: trimmed, without trailing slashes, and https when no scheme is given (a bare
 * hostname, e.g. from Render's `fromService`). Empty when unset, keeping the base URL relative.
 */
export function resolveApiOrigin(value: string | undefined) {
  const url = value?.trim() ?? ''
  if (!url) return ''
  return (/^[a-z][a-z\d+.-]*:\/\//i.test(url) ? url : `https://${url}`).replace(/\/+$/, '')
}

export const API_BASE_URL = `${resolveApiOrigin(import.meta.env.VITE_API_URL)}/api/v1`
