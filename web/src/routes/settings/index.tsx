import { createFileRoute, redirect } from '@tanstack/react-router'

/** `/settings` → its first page. */
export const Route = createFileRoute('/settings/')({
  beforeLoad: () => {
    throw redirect({ to: '/settings/profile' })
  },
})
