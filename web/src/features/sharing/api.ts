import { MOCK_MEMBERS } from './mock-data'
import type { AccessRole, Member, MemberInput, SectionKey } from './types'

// TODO: mocked until the sharing endpoints exist — GET/POST /portfolios/:id/members, PATCH …/:memberId,
// POST …/:memberId/resend, DELETE …/:memberId. In memory per portfolio; the demo portfolio starts with MOCK_MEMBERS.
const DELAY = 500
const later = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), DELAY))
const fail = (message: string) => new Promise<never>((_, reject) => setTimeout(() => reject(new Error(message)), DELAY))

const store = new Map<string, Member[]>()
const membersOf = (portfolioId: string) => {
  if (!store.has(portfolioId)) store.set(portfolioId, portfolioId === 'demo' ? MOCK_MEMBERS.map((m) => ({ ...m })) : [])
  return store.get(portfolioId)!
}
const taken = (list: Member[], email: string, except?: string) =>
  list.some((m) => m.id !== except && m.email.toLowerCase() === email.toLowerCase())

/** Everyone with access or an open invite, except the owner. */
export const listMembers = (portfolioId: string) => later(membersOf(portfolioId).map((m) => ({ ...m })))

export const inviteMember = (portfolioId: string, input: MemberInput): Promise<Member> => {
  const list = membersOf(portfolioId)
  if (taken(list, input.email)) return fail('This person already has access or an invite')
  const member: Member = { id: crypto.randomUUID(), ...input, status: 'invited' }
  list.push(member)
  return later({ ...member })
}

/** Change an active member's role and sections. */
export const updateMember = (portfolioId: string, memberId: string, patch: { role: AccessRole; sections: SectionKey[] }) => {
  const member = membersOf(portfolioId).find((m) => m.id === memberId)
  if (!member) return fail('This person no longer has access')
  Object.assign(member, patch)
  return later({ ...member })
}

/** Edit an open invite and send it again. */
export const resendInvite = (portfolioId: string, memberId: string, input: MemberInput) => {
  const list = membersOf(portfolioId)
  const member = list.find((m) => m.id === memberId)
  if (!member) return fail('This invite no longer exists')
  if (taken(list, input.email, memberId)) return fail('This person already has access or an invite')
  Object.assign(member, input)
  return later({ ...member })
}

/** Remove someone's access, or cancel their invite. */
export const revokeMember = (portfolioId: string, memberId: string) => {
  const list = membersOf(portfolioId)
  const i = list.findIndex((m) => m.id === memberId)
  if (i !== -1) list.splice(i, 1)
  return later(null)
}
