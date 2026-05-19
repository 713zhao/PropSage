import { apiPost } from './client'

export interface ROIRequest {
  purchase_price: number
  loan_amount: number
  annual_rate_pct?: number
  tenure_years?: number
  hold_years?: number
  monthly_rental_sgd?: number
  annual_appreciation_pct?: number
  annual_expenses_pct?: number
}

export interface YearlyResult {
  year: number
  property_value: number
  rental_income: number
  mortgage_payment: number
  annual_expenses: number
  net_cashflow: number
  cumulative_cashflow: number
  loan_balance: number
}

export interface ScenarioResult {
  label: string
  total_return_pct: number
  irr_pct: number
  net_gain: number
  exit_value: number
}

export interface ROIResponse {
  down_payment: number
  yearly: YearlyResult[]
  exit_value: number
  total_rental_income: number
  total_mortgage_paid: number
  total_expenses: number
  net_gain: number
  total_return_pct: number
  irr_pct: number
  scenarios: ScenarioResult[]
}

export function calculateROI(req: ROIRequest): Promise<ROIResponse> {
  return apiPost('/api/roi/calculate', req)
}
