import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { signOut } from '@/lib/session'
import {
  checkEmail,
  deleteAccount,
  getMe,
  getNotificationChannels,
  getViewerInviteAccess,
  onboard,
  removeAvatar,
  requestEmailChange,
  updateNotificationChannels,
  updateProfile,
  updateViewerInviteAccess,
  upgradePlan,
  uploadAvatar,
} from './api'
import type { NotificationChannels, User, ViewerInviteAccess } from './types'

export const meQuery = queryOptions({ queryKey: ['me'], queryFn: getMe, staleTime: 5 * 60_000 })

export const useMe = () => useQuery(meQuery)

/** A mutation that returns the changed user fields and merges them into the cache, so every avatar/name updates at once. */
const useUserMutation = <TInput, TResult extends Partial<User>>(mutationFn: (input: TInput) => Promise<TResult>) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (changes) => qc.setQueryData(meQuery.queryKey, (user) => user && { ...user, ...changes }),
  })
}

export const useOnboard = () => useUserMutation(onboard)

/** Upgrade to Premium (mock): updates the cached user, so trial UI disappears everywhere at once. */
export const useUpgradePlan = () => useUserMutation(upgradePlan)

export const useUpdateProfile = () => useUserMutation(updateProfile)
export const useUploadAvatar = () => useUserMutation(uploadAvatar)
export const useRemoveAvatar = () => useUserMutation(removeAvatar)

export const useCheckEmail = () => useMutation({ mutationFn: checkEmail })
export const useRequestEmailChange = () => useMutation({ mutationFn: requestEmailChange })

/** Deletes the account and signs out, dropping every cached query: nothing of it should outlive the account. */
export const useDeleteAccount = () => useMutation({ mutationFn: deleteAccount, onSuccess: signOut })

export const notificationChannelsQuery = queryOptions({ queryKey: ['me', 'notification-channels'], queryFn: getNotificationChannels })

export const useNotificationChannels = () => useQuery(notificationChannelsQuery)

/**
 * A setting saved as it's changed: the cache takes the new value at once and goes back if the save fails.
 * `merge` turns the cached value + the change into the optimistic value.
 */
const useOptimisticSetting = <T, TInput>(
  queryKey: readonly unknown[],
  mutationFn: (input: TInput) => Promise<T>,
  merge: (old: T, input: TInput) => T,
) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onMutate: async (input: TInput) => {
      await qc.cancelQueries({ queryKey })
      const previous = qc.getQueryData<T>(queryKey)
      if (previous !== undefined) qc.setQueryData<T>(queryKey, merge(previous, input))
      return { previous }
    },
    onError: (_error, _input, context) => qc.setQueryData(queryKey, context?.previous),
    onSuccess: (saved) => qc.setQueryData(queryKey, saved),
  })
}

export const useUpdateNotificationChannels = () =>
  useOptimisticSetting(notificationChannelsQuery.queryKey, updateNotificationChannels, (old: NotificationChannels, patch) => ({
    ...old,
    ...patch,
  }))

export const viewerInviteAccessQuery = queryOptions({ queryKey: ['me', 'viewer-invite-access'], queryFn: getViewerInviteAccess })

export const useViewerInviteAccess = () => useQuery(viewerInviteAccessQuery)

export const useUpdateViewerInviteAccess = () =>
  useOptimisticSetting(viewerInviteAccessQuery.queryKey, updateViewerInviteAccess, (_old: ViewerInviteAccess, next) => next)
