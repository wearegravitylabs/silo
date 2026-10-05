export interface AutopilotRule {
  id: string
  portfolio_id: string
  target_id: string
  target_type: 'asset' | 'debt'
  action: 'add' | 'remove'
  amount: number
  percentage: number
  units: number | null
  frequency: string
  start_date: string
  end_date: string | null
  last_run_at: string | null
  next_run_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateRuleInput {
  target_id: string
  target_type: 'asset' | 'debt'
  action: 'add' | 'remove'
  amount?: number
  units?: number
  percentage?: number
  frequency: string
  start_date: string
  end_date?: string
}
