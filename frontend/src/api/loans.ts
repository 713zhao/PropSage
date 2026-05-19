import { apiPost } from './client'

export interface BankPackage {
  bank: string
  package: string
  rate_type: string
  effective_rate_pct: number
  monthly_installment: number
  total_interest: number
  lock_in_years: number
  tdsr_pct: number | null
  tdsr_passes: boolean | null
}

export interface LoanComparisonRequest {
  loan_amount: number
  tenure_years: number
  gross_monthly_income?: number
  existing_monthly_commitments?: number
}

export interface LoanComparisonResponse {
  sora_rate_pct: number
  packages: BankPackage[]
}

export interface RefinancingOption {
  bank: string
  package: string
  effective_rate_pct: number
  new_monthly_installment: number
  monthly_savings: number
  total_interest_savings: number
  break_even_months: number | null
  tdsr_pct: number | null
  tdsr_passes: boolean | null
}

export interface RefinancingRequest {
  current_outstanding: number
  current_rate_pct: number
  remaining_years: number
  penalty_amount?: number
  gross_monthly_income?: number
  existing_monthly_commitments?: number
}

export interface RefinancingResponse {
  current_monthly_installment: number
  sora_rate_pct: number
  options: RefinancingOption[]
}

export function compareLoans(req: LoanComparisonRequest): Promise<LoanComparisonResponse> {
  return apiPost('/api/loans/compare', req)
}

export function refinanceLoans(req: RefinancingRequest): Promise<RefinancingResponse> {
  return apiPost('/api/loans/refinance', req)
}
