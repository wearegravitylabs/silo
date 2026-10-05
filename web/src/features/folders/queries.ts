import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFolder, deleteFolder, listFolders, reorderFolders, updateFolder } from './api'
import type { Folder, FolderType } from './types'

export const foldersQuery = (portfolioId: string, type: FolderType) =>
  queryOptions({
    queryKey: ['folders', portfolioId, type],
    queryFn: () => listFolders(portfolioId, type),
    staleTime: 2 * 60_000,
  })

/** Folder list. Suspends — preload with `foldersQuery` in the route loader. */
export const useFolders = (portfolioId: string, type: FolderType) => useSuspenseQuery(foldersQuery(portfolioId, type)).data

/** Mutations for one portfolio's folder list. Each refetches the list when done. */
export const useFolderMutations = (portfolioId: string, type: FolderType) => {
  const qc = useQueryClient()
  const { queryKey } = foldersQuery(portfolioId, type)
  const refetch = () => qc.invalidateQueries({ queryKey })

  return {
    create: useMutation({ mutationFn: (name: string) => createFolder(portfolioId, { name, folder_type: type }), onSuccess: refetch }),
    rename: useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) => updateFolder(portfolioId, id, { name }),
      onSuccess: refetch,
    }),
    remove: useMutation({ mutationFn: (id: string) => deleteFolder(portfolioId, id), onSuccess: refetch }),
    reorder: useMutation({
      mutationFn: (ordered: Folder[]) =>
        reorderFolders(
          portfolioId,
          ordered.map((f, i) => ({ id: f.id, position: i })),
        ),
      // Show the new order immediately; the refetch reconciles with the server.
      onMutate: (ordered) => qc.setQueryData(queryKey, ordered),
      onSettled: refetch,
    }),
  }
}
