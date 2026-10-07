import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { Logo } from '@/components/logo'
import { ProgressDots } from '@/components/progress-dots'
import { Button } from '@/components/ui/button'

const STEPS = ['/onboarding/profile', '/onboarding/portfolio']

/** Onboarding shell: logo + log out on top, step dots at the bottom. */
export const Route = createFileRoute('/onboarding')({
  component: OnboardingLayout,
})

function OnboardingLayout() {
  const { pathname } = useLocation()
  const step = STEPS.indexOf(pathname) + 1 || 1

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-18 shrink-0 items-center justify-between px-10">
        <Logo />
        <Button variant="secondary" size="sm" asChild className="shadow-elevated">
          <Link to="/login">Log out</Link>
        </Button>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <Outlet />
      </main>

      <footer className="flex shrink-0 justify-center pb-8">
        <ProgressDots steps={3} current={step} />
      </footer>
    </div>
  )
}
