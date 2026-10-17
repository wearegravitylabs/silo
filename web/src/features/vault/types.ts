/** A file in the portfolio's vault. Stored encrypted; the name and size are kept in the clear for listing. */
export interface VaultDocument {
  id: string
  portfolio_id: string
  file_name: string
  file_size: number
  uploaded_at: string
}

/** Whether the vault has a password yet, and whether it's been unlocked in this session. */
export interface VaultStatus {
  has_password: boolean
  unlocked: boolean
}
