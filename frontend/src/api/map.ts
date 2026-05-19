import { apiGet } from './client'

export interface DistrictData {
  code: string
  name: string
  psf_median: number
  lat: number
  lng: number
  transaction_count: number
}

export interface AmenityPoint {
  name: string
  lat: number
  lng: number
  type: string
  subtype: string
}

export function getDistricts(): Promise<DistrictData[]> {
  return apiGet('/api/map/districts')
}

export function getAmenities(type: 'mrt' | 'school' | 'mall'): Promise<AmenityPoint[]> {
  return apiGet(`/api/map/amenities/${type}`)
}
