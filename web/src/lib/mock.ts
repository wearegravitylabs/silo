/**
 * Stand-in latency for in-memory mocks: `const later = mockDelay(500)` then `return later(value)` resolves after
 * 500ms, so loading states show as they would against the API.
 */
export const mockDelay =
  (ms: number) =>
  <T>(value: T) =>
    new Promise<T>((resolve) => setTimeout(() => resolve(value), ms))
