import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { Logo } from '@/components/logo'
import { ProgressDots } from '@/components/progress-dots'
import { Button } from '@/components/ui/button'
import { FLOWS, flowFor, stepPosition, type OnboardingFlow } from '@/features/onboarding'
import { stepFromPath } from './-steps'

interface OnboardingSearch {
  invite?: string // invite-link token: switches to the invited flow
  portfolio?: string // portfolio created in this flow, for the invite step
}

/** Onboarding shell: logo + log out on top, step dots for the current flow at the bottom. */
export const Route = createFileRoute('/onboarding')({
  validateSearch: (search: Record<string, unknown>): OnboardingSearch => ({
    ...(typeof search.invite === 'string' && { invite: search.invite }),
    ...(typeof search.portfolio === 'string' && { portfolio: search.portfolio }),
  }),
  component: OnboardingLayout,
})

function OnboardingLayout() {
  const { pathname } = useLocation()
  const { invite } = Route.useSearch()
  const step = stepFromPath(pathname)
  const searchFlow = flowFor(invite)
  // A step opened directly (e.g. /onboarding/join with no invite) belongs to whichever flow has it.
  const flow =
    !step || stepPosition(searchFlow, step) ? searchFlow : (Object.keys(FLOWS) as OnboardingFlow[]).find((f) => stepPosition(f, step))!

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-18 shrink-0 items-center justify-between px-4 md:px-10">
        <Logo />
        <Button variant="secondary" size="sm" asChild className="shadow-elevated">
          <Link to="/login">Log out</Link>
        </Button>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        {/* Shared step container: width + entrance. Keyed by path so each step animates in. */}
        <div key={pathname} className="w-full max-w-86 animate-fade-in-up">
          <Outlet />
        </div>
      </main>

      {/* Screens outside the step list (e.g. request-sent) show no dots. */}
      <footer className="flex shrink-0 justify-center pb-8">
        {step && <ProgressDots steps={FLOWS[flow].length} current={stepPosition(flow, step)} />}
      </footer>
    </div>
  )
}
