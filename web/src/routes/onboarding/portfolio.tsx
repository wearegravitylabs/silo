import { createFileRoute } from '@tanstack/react-router'
import { CreatePortfolioStep, flowFor, nextStep } from '@/features/onboarding'
import { STEP_PATH } from './-steps'

export const Route = createFileRoute('/onboarding/portfolio')({
  component: PortfolioPage,
})

function PortfolioPage() {
  const { invite } = Route.useSearch()
  const navigate = Route.useNavigate()
  const next = nextStep(flowFor(invite), 'portfolio')
  return (
    <CreatePortfolioStep
      onCreated={(portfolio) =>
        next
          ? navigate({ to: STEP_PATH[next], search: (prev) => ({ ...prev, portfolio: portfolio.id }) })
          : // TODO: back to portfolio.id once portfolios use the API; mock portfolios vanish on reload, the demo one doesn't.
            navigate({ to: '/portfolio/$portfolioId/dashboard', params: { portfolioId: 'demo' }, search: { welcome: true } })
      }
    />
  )
}
