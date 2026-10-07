/** Every onboarding flow and its step order. Routes and progress dots read from here; nothing else knows the order. */
export const FLOWS = {
  owner: ['profile', 'portfolio', 'invite'], // normal sign-up → their dashboard
  invited: ['join', 'profile'], // arrived through an invite link → waits for the owner's approval
} as const

export type OnboardingFlow = keyof typeof FLOWS
export type OnboardingStep = (typeof FLOWS)[OnboardingFlow][number]

export const flowFor = (invite?: string): OnboardingFlow => (invite ? 'invited' : 'owner')

const steps = (flow: OnboardingFlow): readonly OnboardingStep[] => FLOWS[flow]

export const firstStep = (flow: OnboardingFlow) => steps(flow)[0]

/** 1-indexed position of a step in its flow, for ProgressDots. 0 when the step isn't in the flow. */
export const stepPosition = (flow: OnboardingFlow, step: OnboardingStep) => steps(flow).indexOf(step) + 1

/** The step after this one, or undefined when the flow is finished. */
export const nextStep = (flow: OnboardingFlow, step: OnboardingStep): OnboardingStep | undefined =>
  steps(flow)[steps(flow).indexOf(step) + 1]
