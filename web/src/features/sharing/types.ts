/** What a person can do in a shared portfolio. The owner is implied by `role: 'owner'`. */
export type AccessRole = 'viewer' | 'partner'

/** App sections a viewer/partner can be given access to. */
export type SectionKey = 'dashboard' | 'insights' | 'assets' | 'debts' | 'vault' | 'projections'

export interface Member {
  id: string
  /** Unknown until an invitee signs up — the email stands in. */
  name?: string
  email: string
  avatarUrl?: string | null
  role: 'owner' | AccessRole
  /** `invited`: the invite is sent but not accepted yet. */
  status: 'active' | 'invited'
  sections: SectionKey[]
}

/** Fixed starting state for the dev gallery: what's typed, which menu is open, a copied link. */
export interface SharePreview {
  inviteText?: string
  sections?: SectionKey[]
  openMenu?: 'role' | 'access'
  copied?: boolean
}

/** The signed-in user, shown as the owner at the top of People. */
export interface ShareOwner {
  name: string
  email: string
  avatarUrl?: string | null
}

export type ExportFeature = 'assets' | 'debts' | 'documents' | 'charts'
export type ExportTemplate = 'executive-summary' | 'detailed-report' | 'asset-list'
