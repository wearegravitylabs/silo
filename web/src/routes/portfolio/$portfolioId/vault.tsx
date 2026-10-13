import { createFileRoute } from '@tanstack/react-router'
import { LockIcon } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { StateMessage } from '@/components/route-error'

export const Route = createFileRoute('/portfolio/$portfolioId/vault')({
  component: VaultPage,
})

/** Placeholder until the Vault UI lands: the sidebar and Quick Actions → Upload Document already link here. */
function VaultPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PageHeader eyebrow="Vault" className="px-4 pt-5 md:px-10" title={<h1 className="font-heading font-bold">Documents</h1>} />
      <StateMessage
        icon={<LockIcon className="size-5 text-primary-dark" aria-hidden />}
        title="Vault is coming soon"
        body="Keep statements, contracts and other documents for your portfolio in one secure place."
      />
    </div>
  )
}
