import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { QuotePanel } from './_auth/-components/quote-panel'

/** Auth shell: form column + quote panel. Stays mounted across login → signup → verify. */
export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  const { pathname } = useLocation()
  const centered = pathname === '/verify-email'

  return (
    <div className="flex min-h-dvh">
      <main className={cn('flex flex-1 justify-center overflow-y-auto px-6', centered ? 'items-center py-12' : 'pt-50 pb-16')}>
        {/* Keyed by path so each step animates in */}
        <div key={pathname} className="w-full max-w-86 animate-fade-in-up">
          <Outlet />
        </div>
      </main>
      <QuotePanel />
    </div>
  )
}
