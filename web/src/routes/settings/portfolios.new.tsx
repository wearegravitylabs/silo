import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeftIcon } from 'lucide-react'
import { NewPortfolioForm, usePortfolios } from '@/features/portfolios'
import { SettingsPage } from '@/components/settings-page'

export const Route = createFileRoute('/settings/portfolios/new')({
  // `from`: the portfolio whose settings you came from, for "Back to …"
  validateSearch: (search: Record<string, unknown>): { from?: string } => (typeof search.from === 'string' ? { from: search.from } : {}),
  component: NewPortfolioPage,
})

function NewPortfolioPage() {
  const { from } = Route.useSearch()
  const navigate = Route.useNavigate()
  const portfolios = usePortfolios()
  const back = portfolios.find((p) => p.id === from) ?? portfolios[0]

  return (
    <div className="relative flex flex-1 flex-col">
      {back && (
        <Link
          to="/settings/portfolios/$portfolioId"
          params={{ portfolioId: back.id }}
          replace
          className="mx-4 mt-4 flex w-fit items-center gap-1.5 rounded-md text-muted-foreground transition-opacity outline-none hover:opacity-70 focus-visible:ring-2 focus-visible:ring-ring/40 md:absolute md:top-4 md:left-6 md:m-0"
        >
          <ChevronLeftIcon className="size-3.5" />
          <span className="truncate">Back to {back.name}</span>
        </Link>
      )}
      <SettingsPage title="Create a new Portfolio" description="Your portfolio is where you track specific assets, debts and insights">
        <NewPortfolioForm
          // The currency you already work in is the likely one
          defaultCurrency={back?.base_currency}
          onCreated={(p) => navigate({ to: '/settings/portfolios/$portfolioId', params: { portfolioId: p.id }, replace: true })}
        />
      </SettingsPage>
    </div>
  )
}
