import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useVaultDocumentMutations,
  useVaultDocuments,
  useVaultStatus,
  VaultHeader,
  VaultSetupDialog,
  VaultTable,
  VaultUnlock,
  vaultDocumentsQuery,
  vaultStatusQuery,
} from '@/features/vault'

export const Route = createFileRoute('/portfolio/$portfolioId/vault')({
  loader: ({ context: { queryClient }, params: { portfolioId } }) =>
    Promise.all([
      queryClient.query({ ...vaultStatusQuery(portfolioId), staleTime: 'static' }),
      queryClient.query({ ...vaultDocumentsQuery(portfolioId), staleTime: 'static' }),
    ]),
  pendingComponent: VaultSkeleton,
  component: VaultPage,
})

/**
 * Vault: locked until the password is re-entered; otherwise the document table. A vault without a password
 * opens the setup (intro → create password) on arrival, and again from Upload Document.
 */
function VaultPage() {
  const { portfolioId } = Route.useParams()
  const status = useVaultStatus(portfolioId)
  const { data: documents = [], isPending } = useVaultDocuments(portfolioId)
  const { upload } = useVaultDocumentMutations(portfolioId)
  const [setupOpen, setSetupOpen] = useState(!status.has_password)
  const fileInput = useRef<HTMLInputElement>(null)

  if (status.has_password && !status.unlocked) return <VaultUnlock portfolioId={portfolioId} />

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <VaultHeader
        count={documents.length}
        // TODO: Settings (change password, auto-lock) isn't designed yet.
        onUpload={() => (status.has_password ? fileInput.current?.click() : setSetupOpen(true))}
      />
      <input
        ref={fileInput}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          Array.from(e.target.files ?? []).forEach((file) => upload.mutate(file))
          e.target.value = ''
        }}
      />
      <VaultTable portfolioId={portfolioId} documents={documents} loading={isPending} />
      <VaultSetupDialog portfolioId={portfolioId} open={setupOpen} onOpenChange={setSetupOpen} />
    </div>
  )
}

/** Header, toolbar and table outline while the vault loads. */
function VaultSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" role="status" aria-label="Loading vault">
      <div className="flex items-center justify-between gap-3 px-4 pt-5 md:px-10">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-2.5 w-10" />
          <Skeleton className="h-6 w-28" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-7 w-22 rounded-md" />
          <Skeleton className="h-7 w-36 rounded-md" />
        </div>
      </div>
      <div className="mx-4 mb-6 flex min-h-0 flex-1 flex-col md:mx-10 md:mb-10">
        <div className="flex flex-wrap justify-between gap-2 py-6">
          <Skeleton className="h-7 w-32 rounded-md" />
          <Skeleton className="h-8 w-full rounded-lg md:w-100" />
        </div>
        <Skeleton className="flex-1 rounded-2xl" />
      </div>
    </div>
  )
}
