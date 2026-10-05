import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { isDashboardPeriod, type DashboardPeriod } from '@/features/dashboard'
import { portfoliosQuery } from '@/features/portfolios'
import { queryClient } from '@/lib/query-client'
import { AppLayout } from '@/routes/app-layout/app-layout'
import { AuthLayout } from '@/routes/auth/auth-layout'
import { LoginPage } from '@/routes/auth/login-page'
import { SignupPage } from '@/routes/auth/signup-page'
import { VerifyEmailPage } from '@/routes/auth/verify-email-page'
import { OnboardingLayout } from '@/routes/onboarding/onboarding-layout'
import { PortfolioPage } from '@/routes/onboarding/portfolio-page'
import { ProfilePage } from '@/routes/onboarding/profile-page'
import { useAuthStore } from '@/stores/auth-store'

// ─── Guards ───────────────────────────────────────────────────────────────────
const requireAuth = () => {
  if (!useAuthStore.getState().accessToken) throw redirect({ to: '/login' })
}

const requireOnboarded = () => {
  requireAuth()
  if (useAuthStore.getState().user?.is_onboarded === false) throw redirect({ to: '/onboarding/profile' })
}

// ─── Routes ───────────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({ component: Outlet })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    requireOnboarded()
    throw redirect({ to: '/dashboard' })
  },
})

// AuthLayout mounts once for the whole auth flow, so the quote carousel keeps
// running while the user moves between login → signup → verify.
const authRoute = createRoute({ getParentRoute: () => rootRoute, id: '_auth', component: AuthLayout })
const loginRoute = createRoute({ getParentRoute: () => authRoute, path: '/login', component: LoginPage })
const signupRoute = createRoute({ getParentRoute: () => authRoute, path: '/signup', component: SignupPage })
const verifyEmailRoute = createRoute({ getParentRoute: () => authRoute, path: '/verify-email', component: VerifyEmailPage })

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_onboarding',
  beforeLoad: requireAuth,
  component: OnboardingLayout,
})
const onboardingProfileRoute = createRoute({
  getParentRoute: () => onboardingRoute,
  path: '/onboarding/profile',
  component: ProfilePage,
})
const onboardingPortfolioRoute = createRoute({
  getParentRoute: () => onboardingRoute,
  path: '/onboarding/portfolio',
  component: PortfolioPage,
})

// Signed-in app: sidebar shell, each section lazy-loaded as its own chunk.
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_app',
  beforeLoad: async () => {
    requireOnboarded()
    // Load portfolios before the shell renders; with none, send the user to create one.
    const portfolios = await queryClient.ensureQueryData(portfoliosQuery)
    if (!portfolios.length) throw redirect({ to: '/onboarding/portfolio' })
  },
  component: AppLayout,
})
const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/dashboard',
  // ?period=1W|1M|3M|6M|1Y; omitted means the default (1M)
  validateSearch: (search: Record<string, unknown>): { period?: DashboardPeriod } =>
    isDashboardPeriod(search.period) ? { period: search.period } : {},
  component: lazyRouteComponent(() => import('@/routes/dashboard/dashboard-page'), 'DashboardPage'),
})
const assetsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/assets',
  component: lazyRouteComponent(() => import('@/routes/assets/assets-page'), 'AssetsPage'),
})

export const routeTree = rootRoute.addChildren([
  indexRoute,
  authRoute.addChildren([loginRoute, signupRoute, verifyEmailRoute]),
  onboardingRoute.addChildren([onboardingProfileRoute, onboardingPortfolioRoute]),
  appRoute.addChildren([dashboardRoute, assetsRoute]),
])

export const router = createRouter({ routeTree })

// Whenever the session ends — logout, or a refresh token the API rejects — go to login.
useAuthStore.subscribe((state, prev) => {
  if (prev.accessToken && !state.accessToken) router.navigate({ to: '/login' })
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
