import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFolder, deleteFolder, listFolders, reorderFolders, updateFolder } from './api'
import type { Folder, FolderType } from './types'

export const folderKeys = {
  all: ['folders'] as const,
  list: (portfolioId: string, type: FolderType) => ['folders', portfolioId, type] as const,
}

export const useFolders = (portfolioId: string, type: FolderType) =>
  useQuery({
    queryKey: folderKeys.list(portfolioId, type),
    queryFn: () => listFolders(portfolioId, type),
    enabled: !!portfolioId,
    staleTime: 2 * 60_000,
  })

/** Mutations for one portfolio's folder list. Each refetches the list when done. */
export const useFolderMutations = (portfolioId: string, type: FolderType) => {
  const qc = useQueryClient()
  const key = folderKeys.list(portfolioId, type)
  const refetch = () => qc.invalidateQueries({ queryKey: key })

  return {
    create: useMutation({
      mutationFn: (name: string) => createFolder(portfolioId, { name, folder_type: type }),
      onSuccess: refetch,
    }),
    rename: useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) => updateFolder(portfolioId, id, { name }),
      onSuccess: refetch,
    }),
    remove: useMutation({
      mutationFn: (id: string) => deleteFolder(portfolioId, id),
      onSuccess: refetch,
    }),
    reorder: useMutation({
      mutationFn: (ordered: Folder[]) =>
        reorderFolders(portfolioId, ordered.map((f, i) => ({ id: f.id, position: i }))),
      // Show the new order immediately; the refetch reconciles with the server.
      onMutate: (ordered) => qc.setQueryData(key, ordered),
      onSettled: refetch,
    }),
  }
}
