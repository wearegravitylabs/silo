import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMe } from '@/features/account'
import { DashboardOverview, WelcomeModal, type DashboardMock, type DashboardPeriod } from '@/features/dashboard'
import { usePortfolio } from '@/features/portfolios'
import { useSiloAiPanel } from '@/stores/silo-ai-store'

type DashboardSearch = {
  /** Set by onboarding: open the welcome intro once on arrival. */
  welcome?: true
  /** Dev: force the busy or empty mock. */
  mock?: DashboardMock
}

export const Route = createFileRoute('/portfolio/$portfolioId/dashboard')({
  validateSearch: (search: Record<string, unknown>): DashboardSearch => ({
    welcome: search.welcome === true || search.welcome === 'true' ? true : undefined,
    mock: search.mock === 'busy' || search.mock === 'empty' ? search.mock : undefined,
  }),
  component: DashboardPage,
})

// TODO: temporary — the welcome intro opens on every fresh page load (once per load, not on in-app navigation).
// Remove once onboarding's ?welcome=true is the only trigger.
let welcomeShownThisLoad = false

function DashboardPage() {
  const { portfolioId } = Route.useParams()
  const { welcome, mock } = Route.useSearch()
  const navigate = Route.useNavigate()
  const portfolio = usePortfolio(portfolioId)
  const { data: me } = useMe()
  const openAi = useSiloAiPanel((s) => s.setOpen)
  const [period, setPeriod] = useState<DashboardPeriod>('1M')
  const [firstLoad, setFirstLoad] = useState(() => !welcomeShownThisLoad)
  useEffect(() => {
    welcomeShownThisLoad = true
  }, [])

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <DashboardOverview
        portfolioId={portfolioId}
        portfolioName={portfolio.name}
        firstName={me?.first_name}
        period={period}
        mock={mock}
        onPeriodChange={setPeriod}
        // TODO: open Add Asset on the picked type (stock, crypto, real estate) once the sheet takes one.
        onAddAsset={() => navigate({ to: '/portfolio/$portfolioId/assets', params: { portfolioId } })}
        onAddDebt={() => navigate({ to: '/portfolio/$portfolioId/debts', params: { portfolioId }, search: { create: true } })}
        onUploadDocument={() => navigate({ to: '/portfolio/$portfolioId/vault', params: { portfolioId } })}
        onTalkToAi={() => openAi(true)}
      />
      <WelcomeModal
        open={!!welcome || firstLoad}
        onOpenChange={(open) => {
          if (open) return
          setFirstLoad(false)
          if (welcome) navigate({ search: (prev) => ({ ...prev, welcome: undefined }), replace: true })
        }}
      />
    </div>
  )
}
