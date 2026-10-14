import { queryOptions, useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createVaultPassword, deleteVaultDocument, getVaultStatus, listVaultDocuments, unlockVault, uploadVaultDocument } from './api'
import type { VaultStatus } from './types'

export const vaultKeys = {
  status: (portfolioId: string) => ['vault', portfolioId, 'status'] as const,
  documents: (portfolioId: string) => ['vault', portfolioId, 'documents'] as const,
}

export const vaultStatusQuery = (portfolioId: string) =>
  queryOptions({ queryKey: vaultKeys.status(portfolioId), queryFn: () => getVaultStatus(portfolioId), staleTime: Infinity })

export const vaultDocumentsQuery = (portfolioId: string) =>
  queryOptions({ queryKey: vaultKeys.documents(portfolioId), queryFn: () => listVaultDocuments(portfolioId), staleTime: 60_000 })

/** Password set / unlocked. Suspends — preload with `vaultStatusQuery` in the route loader. */
export const useVaultStatus = (portfolioId: string) => useSuspenseQuery(vaultStatusQuery(portfolioId)).data

export const useVaultDocuments = (portfolioId: string) => useQuery(vaultDocumentsQuery(portfolioId))

/** Create the password or unlock with it; either way the vault opens. */
const useVaultAccess = (portfolioId: string, access: (portfolioId: string, password: string) => Promise<VaultStatus>) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (password: string) => access(portfolioId, password),
    onSuccess: (status) => qc.setQueryData(vaultKeys.status(portfolioId), status),
  })
}
export const useCreateVaultPassword = (portfolioId: string) => useVaultAccess(portfolioId, createVaultPassword)
export const useUnlockVault = (portfolioId: string) => useVaultAccess(portfolioId, unlockVault)

export const useVaultDocumentMutations = (portfolioId: string) => {
  const qc = useQueryClient()
  const refetch = () => qc.invalidateQueries({ queryKey: vaultKeys.documents(portfolioId) })
  return {
    upload: useMutation({ mutationFn: (file: File) => uploadVaultDocument(portfolioId, file), onSuccess: refetch }),
    remove: useMutation({ mutationFn: (docId: string) => deleteVaultDocument(portfolioId, docId), onSuccess: refetch }),
  }
}
