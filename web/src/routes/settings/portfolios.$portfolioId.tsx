import { createFileRoute, notFound } from '@tanstack/react-router'
import { useMe } from '@/features/account'
import { PortfolioLink, PortfolioSettings, PortfolioTitle, portfoliosQuery, usePortfolios } from '@/features/portfolios'
import { SettingsPage } from '@/components/settings-page'

export const Route = createFileRoute('/settings/portfolios/$portfolioId')({
  loader: async ({ context: { queryClient }, params }) => {
    const portfolios = await queryClient.query({ ...portfoliosQuery, staleTime: 'static' })
    if (!portfolios.some((p) => p.id === params.portfolioId)) throw notFound()
  },
  component: PortfolioSettingsPage,
})

function PortfolioSettingsPage() {
  const { portfolioId } = Route.useParams()
  const { data: me } = useMe()
  const portfolios = usePortfolios()
  const portfolio = portfolios.find((p) => p.id === portfolioId)
  // Gone after Leave/Delete, for the moment before the page moves on.
  if (!portfolio) return null

  return (
    <SettingsPage title={<PortfolioTitle portfolio={portfolio} />} description={<PortfolioLink portfolio={portfolio} />}>
      {me && (
        <PortfolioSettings
          key={portfolio.id}
          portfolio={portfolio}
          isOwner={portfolio.user_id === me.id}
          canLeave={portfolios.length > 1}
          nextPortfolioId={portfolios.find((p) => p.id !== portfolio.id)?.id}
        />
      )}
    </SettingsPage>
  )
}
