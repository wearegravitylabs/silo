export interface Portfolio {
  id: string
  user_id: string
  name: string
  description: string
  base_currency: string
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface Currency {
  code: string // "USD"
  name: string // "US Dollar"
  symbol: string // "$"
}

export interface CreatePortfolioInput {
  name: string
  base_currency: string
  description?: string
  image_url?: string | null
}

export type UpdatePortfolioInput = Partial<CreatePortfolioInput>

/** What an invite link points at, looked up by the token in the link. */
export interface Invitation {
  token: string
  portfolio: Pick<Portfolio, 'id' | 'name' | 'image_url'>
  owner: { first_name: string; last_name: string; avatar_url: string | null }
}
