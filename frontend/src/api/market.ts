import { apiGet } from './client'

export interface PPIRecord {
  quarter: string
  index: number
  change_pct: number
}

export interface RentalRecord {
  quarter: string
  property_type: string
  region: string
  index: number
}

export interface VolumeRecord {
  month: string
  new_sale: number
  sub_sale: number
  resale: number
}

export interface VacancyRecord {
  quarter: string
  property_type: string
  vacancy_pct: number
}

export const getPPI = () => apiGet<PPIRecord[]>('/api/market/ppi')
export const getRental = () => apiGet<RentalRecord[]>('/api/market/rental')
export const getVolume = () => apiGet<VolumeRecord[]>('/api/market/volume')
export const getVacancy = () => apiGet<VacancyRecord[]>('/api/market/vacancy')
