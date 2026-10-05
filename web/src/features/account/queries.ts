import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMe, onboard } from './api'

export const meQuery = queryOptions({ queryKey: ['me'], queryFn: getMe, staleTime: 5 * 60_000 })

export const useMe = () => useQuery(meQuery)

export const useOnboard = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: onboard, onSuccess: (user) => qc.setQueryData(meQuery.queryKey, user) })
}
