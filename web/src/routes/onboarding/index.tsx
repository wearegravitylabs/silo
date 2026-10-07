import { createFileRoute, redirect } from '@tanstack/react-router'
import { firstStep, flowFor } from '@/features/onboarding'
import { STEP_PATH } from './-steps'

/** `/onboarding` → the first step of whichever flow the search params select. */
export const Route = createFileRoute('/onboarding/')({
  beforeLoad: ({ search }) => {
    throw redirect({ to: STEP_PATH[firstStep(flowFor(search.invite))], search })
  },
})
