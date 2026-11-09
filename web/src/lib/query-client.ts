import { QueryClient } from '@tanstack/react-query'
import { isConnectionError } from './api-client'

export const queryClient = new QueryClient({
  defaultOptions: {
    // networkMode 'always': fail straight away when offline instead of pausing until the connection is back, which
    // left pages on their skeleton with no explanation. The connection banner says why and retries on reconnect, so
    // connection errors aren't retried here.
    queries: { staleTime: 60_000, retry: (count, error) => count < 1 && !isConnectionError(error), networkMode: 'always' },
    mutations: { retry: 0, networkMode: 'always' },
  },
})
