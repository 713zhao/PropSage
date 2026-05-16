import { apiPost } from './client'

export interface TaxRequest {
  purchase_price: number
  citizenship: string
  existing_property_count: number
  renovation_budget?: number
  agent_rate?: number
}

export interface TaxResponse {
  purchase_price: number
  bsd: number
  absd: number
  legal_fees: number
  agent_commission: number
  valuation_fee: number
  renovation_budget: number
  total_cash_outlay: number
}

export interface SSDRequest {
  purchase_price: number
  hold_years: number
}

export interface SSDResponse {
  ssd: number
  ssd_rate: number
  hold_years: number
}

export const calculateUpfrontCost = (req: TaxRequest) =>
  apiPost<TaxResponse>('/api/tax/upfront-cost', req)

export const calculateSsd = (req: SSDRequest) =>
  apiPost<SSDResponse>('/api/tax/ssd', req)
