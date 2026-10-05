import { createFileRoute } from '@tanstack/react-router'
import { CreatePortfolioForm } from '@/features/portfolios'

export const Route = createFileRoute('/onboarding/portfolio')({
  component: PortfolioPage,
})

function PortfolioPage() {
  const navigate = Route.useNavigate()
  return (
    <CreatePortfolioForm onCreated={(portfolio) => navigate({ to: '/p/$portfolioId/dashboard', params: { portfolioId: portfolio.id } })} />
  )
}
