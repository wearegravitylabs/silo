import { createFileRoute } from '@tanstack/react-router'
// import { redirect } from '@tanstack/react-router' // GUARD disabled
import { RequestSentStep } from '@/features/onboarding'

/** Terminal screen of the invited flow. Not a counted step, so the layout shows no progress dots. */
export const Route = createFileRoute('/onboarding/request-sent')({
  // GUARD disabled for screen review — only the invited flow ends here.
  // beforeLoad: ({ search }) => {
  //   if (!search.invite) throw redirect({ to: '/onboarding' })
  // },
  component: RequestSentStep,
})
