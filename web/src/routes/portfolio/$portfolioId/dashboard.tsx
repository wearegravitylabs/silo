import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMe } from '@/features/account'
import { DashboardOverview, type DashboardPeriod } from '@/features/dashboard'
import { usePortfolio } from '@/features/portfolios'
import { useSiloAiPanel } from '@/stores/silo-ai-store'

export const Route = createFileRoute('/portfolio/$portfolioId/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { portfolioId } = Route.useParams()
  const navigate = Route.useNavigate()
  const portfolio = usePortfolio(portfolioId)
  const { data: me } = useMe()
  const openAi = useSiloAiPanel((s) => s.setOpen)
  const [period, setPeriod] = useState<DashboardPeriod>('1M')

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <DashboardOverview
        portfolioId={portfolioId}
        portfolioName={portfolio.name}
        firstName={me?.first_name}
        period={period}
        onPeriodChange={setPeriod}
        onAddAsset={() => navigate({ to: '/portfolio/$portfolioId/assets', params: { portfolioId }, search: { create: true } })}
        onTalkToAi={() => openAi(true)}
      />
    </div>
  )
}
