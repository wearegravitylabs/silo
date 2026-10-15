import { createFileRoute } from '@tanstack/react-router'
import { useMe } from '@/features/account'
import { portfoliosQuery, usePortfolios } from '@/features/portfolios'
import { membersQuery, PartnersSettings } from '@/features/sharing'
import { SettingsPage } from '@/components/settings-page'

export const Route = createFileRoute('/settings/partners')({
  loader: async ({ context: { queryClient } }) => {
    const [first] = await queryClient.query({ ...portfoliosQuery, staleTime: 'static' })
    if (first) void queryClient.prefetchQuery(membersQuery(first.id))
  },
  component: PartnersPage,
})

function PartnersPage() {
  const { data: me } = useMe()
  // People belong to a portfolio; settings manage your first (in practice, your only) one's.
  const [portfolio] = usePortfolios()

  return (
    <SettingsPage wide title="Partners" description="Manage and collaborate with partners">
      {portfolio && me && (
        <PartnersSettings
          portfolioId={portfolio.id}
          owner={{ name: `${me.first_name} ${me.last_name}`, email: me.email, avatarUrl: me.avatar_url, joinedAt: me.created_at }}
        />
      )}
    </SettingsPage>
  )
}
