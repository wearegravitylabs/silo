import type { OnboardingStep } from '@/features/onboarding'

/** Route for each onboarding step. `satisfies` makes adding a step to a flow without a route a type error. */
export const STEP_PATH = {
  profile: '/onboarding/profile',
  portfolio: '/onboarding/portfolio',
  invite: '/onboarding/invite',
  join: '/onboarding/join',
} as const satisfies Record<OnboardingStep, string>

export const stepFromPath = (pathname: string) => (Object.keys(STEP_PATH) as OnboardingStep[]).find((s) => STEP_PATH[s] === pathname)
