import type { QueryClient } from '@tanstack/react-query'
import { redirect } from '@tanstack/react-router'
import { meQuery, type User } from '@/features/account'
import { hasSession } from '@/lib/session'

/**
 * `beforeLoad` guard for signed-in pages: no session → /login. With `onboarded`, a user who hasn't
 * finished onboarding goes there first (the API refuses everything else until they have).
 */
export async function requireUser(queryClient: QueryClient, { onboarded }: { onboarded: boolean }): Promise<User> {
  if (!hasSession()) throw redirect({ to: '/login' })
  let me: User
  try {
    me = await queryClient.ensureQueryData(meQuery)
  } catch (err) {
    // The API client ends the session when it can't be refreshed; anything else (API down) is a route error.
    if (!hasSession()) throw redirect({ to: '/login' })
    throw err
  }
  if (onboarded && !me.is_onboarded) throw redirect({ to: '/onboarding' })
  return me
}

/** `beforeLoad` guard for the sign-in screens: a signed-in user goes to the app instead. */
export function redirectIfSignedIn() {
  if (hasSession()) throw redirect({ to: '/' })
}
