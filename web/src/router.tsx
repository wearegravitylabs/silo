import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { AuthLayout } from '@/layouts/AuthLayout'
import { SignupPage } from '@/pages/auth/SignupPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage'
import { ProfilePage } from '@/pages/onboarding/ProfilePage'
import { PortfolioPage } from '@/pages/onboarding/PortfolioPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { AssetsPage } from '@/pages/AssetsPage'
import { useAuthStore } from '@/store/auth'

const rootRoute = createRootRoute({ component: Outlet })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: async () => {
    const { accessToken, user } = useAuthStore.getState()
    if (!accessToken) throw redirect({ to: '/login' })
    if (!user?.is_onboarded) throw redirect({ to: '/onboarding/profile' })
    throw redirect({ to: '/dashboard' })
  },
})

// ─── Persistent auth shell ────────────────────────────────────────────────────
// AuthLayout mounts ONCE for the entire auth flow. The right-panel quote
// carousel keeps running while the user moves between login → signup → verify.
const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_auth',
  component: AuthLayout,
})

const loginRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/login',
  component: LoginPage,
})

const signupRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/signup',
  component: SignupPage,
})

const verifyEmailRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/verify-email',
  component: VerifyEmailPage,
})

// ─── Protected routes ────────────────────────────────────────────────────────
const requireAuth = async () => {
  const { accessToken } = useAuthStore.getState()
  if (!accessToken) throw redirect({ to: '/login' })
}

const onboardingProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding/profile',
  beforeLoad: requireAuth,
  component: ProfilePage,
})

const onboardingPortfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding/portfolio',
  beforeLoad: requireAuth,
  component: PortfolioPage,
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: requireAuth,
  component: DashboardPage,
})

const assetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/assets',
  beforeLoad: requireAuth,
  component: AssetsPage,
})

export const routeTree = rootRoute.addChildren([
  indexRoute,
  authRoute.addChildren([loginRoute, signupRoute, verifyEmailRoute]),
  onboardingProfileRoute,
  onboardingPortfolioRoute,
  dashboardRoute,
  assetsRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
