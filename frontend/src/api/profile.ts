import { apiPost } from './client'

export interface AffordabilityRequest {
  purchase_price: number
  gross_monthly_income: number
  existing_monthly_commitments?: number
  loan_tenure_years?: number
  existing_loan_count?: number
  is_hdb?: boolean
}

export interface AffordabilityResponse {
  max_loan: number
  min_down_payment: number
  min_cash_portion: number
  ltv_limit: number
  is_feasible: boolean
  tdsr_ratio: number
  tdsr_pct: number
  tdsr_passes: boolean
  msr_ratio: number | null
  msr_pct: number | null
  msr_passes: boolean | null
}

export const checkAffordability = (req: AffordabilityRequest) =>
  apiPost<AffordabilityResponse>('/api/profile/affordability', req)
