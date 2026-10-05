import { useNavigate } from '@tanstack/react-router'
import { CreatePortfolioForm } from '@/features/portfolios'

export function PortfolioPage() {
  const navigate = useNavigate()
  return <CreatePortfolioForm onCreated={() => navigate({ to: '/dashboard' })} />
}
