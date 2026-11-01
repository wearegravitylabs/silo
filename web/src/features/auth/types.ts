import type { AuthTokens } from '@/lib/session'

/** verify-code response. Generic over the user: auth can't import the account feature's User type. */
export type AuthResponse<TUser> = AuthTokens & { user: TUser }

export interface VerifyCodeInput {
  email: string
  code: string
}
