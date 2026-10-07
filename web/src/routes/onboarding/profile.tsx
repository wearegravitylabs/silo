import { createFileRoute } from '@tanstack/react-router'
import { flowFor, nextStep, ProfileStep } from '@/features/onboarding'
import { STEP_PATH } from './-steps'

export const Route = createFileRoute('/onboarding/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { invite } = Route.useSearch()
  const navigate = Route.useNavigate()
  const next = nextStep(flowFor(invite), 'profile')
  return (
    <ProfileStep
      onDone={() =>
        next
          ? navigate({ to: STEP_PATH[next], search: (prev) => prev })
          : // Profile ends the invited flow: their join request now waits on the owner.
            navigate({ to: '/onboarding/request-sent', search: (prev) => prev })
      }
    />
  )
}
