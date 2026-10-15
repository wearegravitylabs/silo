import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  checkEmail,
  deleteAccount,
  getMe,
  onboard,
  removeAvatar,
  requestDeletionCode,
  requestEmailChange,
  updateProfile,
  upgradePlan,
  uploadAvatar,
} from './api'
import type { User } from './types'

export const meQuery = queryOptions({ queryKey: ['me'], queryFn: getMe, staleTime: 5 * 60_000 })

export const useMe = () => useQuery(meQuery)

/** A mutation that returns the updated user and writes it to the cache, so every avatar/name updates at once. */
const useUserMutation = <TInput>(mutationFn: (input: TInput) => Promise<User>) => {
  const qc = useQueryClient()
  return useMutation({ mutationFn, onSuccess: (user) => qc.setQueryData(meQuery.queryKey, user) })
}

export const useOnboard = () => useUserMutation(onboard)

/** Upgrade to Premium (mock): updates the cached user, so trial UI disappears everywhere at once. */
export const useUpgradePlan = () => useUserMutation(upgradePlan)

export const useUpdateProfile = () => useUserMutation(updateProfile)
export const useUploadAvatar = () => useUserMutation(uploadAvatar)
export const useRemoveAvatar = () => useUserMutation(removeAvatar)

export const useCheckEmail = () => useMutation({ mutationFn: checkEmail })
export const useRequestEmailChange = () => useMutation({ mutationFn: requestEmailChange })
export const useRequestDeletionCode = () => useMutation({ mutationFn: requestDeletionCode })

/** Deletes the account and drops every cached query — nothing of it should outlive the account. */
export const useDeleteAccount = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: deleteAccount, onSuccess: () => qc.clear() })
}
