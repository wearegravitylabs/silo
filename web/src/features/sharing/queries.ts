import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { inviteMember, listMembers, resendInvite, revokeMember, updateMember } from './api'
import type { AccessRole, MemberInput, SectionKey } from './types'

export const membersQuery = (portfolioId: string) =>
  queryOptions({ queryKey: ['portfolio', portfolioId, 'members'], queryFn: () => listMembers(portfolioId), staleTime: 60_000 })

export const useMembers = (portfolioId: string) => useQuery(membersQuery(portfolioId))

/** Invite, edit/resend, change access, revoke — each refetches the list when it lands. */
export const useMemberMutations = (portfolioId: string) => {
  const qc = useQueryClient()
  const refetch = () => qc.invalidateQueries({ queryKey: membersQuery(portfolioId).queryKey })
  return {
    invite: useMutation({ mutationFn: (input: MemberInput) => inviteMember(portfolioId, input), onSuccess: refetch }),
    resend: useMutation({
      mutationFn: ({ id, ...input }: MemberInput & { id: string }) => resendInvite(portfolioId, id, input),
      onSuccess: refetch,
    }),
    update: useMutation({
      mutationFn: ({ id, ...patch }: { id: string; role: AccessRole; sections: SectionKey[] }) => updateMember(portfolioId, id, patch),
      onSuccess: refetch,
    }),
    revoke: useMutation({ mutationFn: (id: string) => revokeMember(portfolioId, id), onSuccess: refetch }),
  }
}
