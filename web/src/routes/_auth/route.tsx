import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router'
import { QuotePanel } from './-components/quote-panel'

/** Auth shell: form column + quote panel. Stays mounted across login → signup → verify. */
export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen lg:h-screen">
      <main className="flex flex-1 items-center justify-center overflow-y-auto px-4">
        {/* Keyed by path so each step animates in */}
        <div key={pathname} className="w-full max-w-86 animate-fade-in-up">
          <Outlet />
        </div>
      </main>
      <QuotePanel />
    </div>
  )
}
