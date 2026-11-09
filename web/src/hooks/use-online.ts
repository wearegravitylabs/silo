import { useEffect, useRef, useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

/** Whether the browser thinks it has a network connection, kept live by the online/offline events. */
export function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine)
}

/** Calls `retry` each time the connection comes back, while `enabled`. */
export function useRetryOnReconnect(enabled: boolean, retry: () => void) {
  const online = useOnline()
  const wasOnline = useRef(online)
  const latest = useRef(retry)

  useEffect(() => {
    latest.current = retry
  })

  useEffect(() => {
    if (enabled && online && !wasOnline.current) latest.current()
    wasOnline.current = online
  }, [enabled, online])
}
