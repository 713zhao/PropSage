import { apiGet } from './client'

export interface DevelopmentProfile {
  id: number
  name: string
  district: string
  age_years: number
  plot_ratio_headroom: number
  land_area_sqft: number
  previous_csc_attempt: boolean
  ownership_units: number
  lease_remaining_years: number
  csc_status: string
  lat: number
  lng: number
  score: number
}

export function getDevelopments(): Promise<DevelopmentProfile[]> {
  return apiGet('/api/enbloc/developments')
}
