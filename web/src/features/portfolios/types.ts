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
  code: string   // "USD"
  name: string   // "US Dollar"
  symbol: string // "$"
}

export interface CreatePortfolioInput {
  name: string
  base_currency: string
  description?: string
  image_url?: string | null
}

export type UpdatePortfolioInput = Partial<CreatePortfolioInput>
