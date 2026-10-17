import { createFileRoute } from '@tanstack/react-router'
import { TwoFactorSetting, useMe, ViewerInviteAccessSetting } from '@/features/account'
import { portfoliosQuery, usePortfolios } from '@/features/portfolios'
import { VaultPasswordSetting, vaultStatusQuery } from '@/features/vault'
import { SettingsPage } from '@/components/settings-page'

export const Route = createFileRoute('/settings/security')({
  // The vault password section suspends on its status, so have it ready.
  loader: async ({ context: { queryClient } }) => {
    const [first] = await queryClient.query({ ...portfoliosQuery, staleTime: 'static' })
    if (first) await queryClient.query(vaultStatusQuery(first.id))
  },
  component: SecurityPage,
})

function SecurityPage() {
  const { data: me } = useMe()
  // Vaults belong to portfolios; settings manage your first (in practice, your only) one's.
  const [portfolio] = usePortfolios()

  return (
    <SettingsPage title="Security & Access" description="Manage your security settings and access permissions">
      <div className="flex flex-col gap-6">
        {portfolio && me && <VaultPasswordSetting portfolioId={portfolio.id} email={me.email} />}
        <TwoFactorSetting />
        <ViewerInviteAccessSetting />
      </div>
    </SettingsPage>
  )
}
