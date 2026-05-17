import { apiPost } from './client'

export interface TransactionRecord {
  project: string
  street: string
  district: string
  area_sqft: number
  price: number
  psf: number
  floor_range: string
  tenure: string
  sale_date: string
  property_type: string
}

export interface TransactionSearchRequest {
  district?: string
  property_type?: string
  min_price?: number
  max_price?: number
  min_psf?: number
  max_psf?: number
  limit?: number
}

export interface CompsRequest {
  district: string
  area_sqft: number
  tolerance_pct?: number
}

export const searchTransactions = (req: TransactionSearchRequest) =>
  apiPost<TransactionRecord[]>('/api/transactions/search', req)

export const getComps = (req: CompsRequest) =>
  apiPost<TransactionRecord[]>('/api/transactions/comps', req)
