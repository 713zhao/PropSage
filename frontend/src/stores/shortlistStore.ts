import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ShortlistedProperty {
  id: string
  project: string
  street: string
  district: string
  area_sqft: number
  price: number
  psf: number
  floor_range: string
  tenure: string
  property_type: string
  addedAt: string
}

interface ShortlistState {
  properties: ShortlistedProperty[]
  addProperty: (p: Omit<ShortlistedProperty, 'id' | 'addedAt'>) => void
  removeProperty: (id: string) => void
  isShortlisted: (project: string, floor_range: string, price: number) => boolean
  clearAll: () => void
}

export const useShortlistStore = create<ShortlistState>()(
  persist(
    (set, get) => ({
      properties: [],
      addProperty: (p) => {
        const current = get().properties
        if (current.length >= 10) return
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        set({ properties: [...current, { ...p, id, addedAt: new Date().toISOString() }] })
      },
      removeProperty: (id) =>
        set((s) => ({ properties: s.properties.filter((p) => p.id !== id) })),
      isShortlisted: (project, floor_range, price) =>
        get().properties.some(
          (p) => p.project === project && p.floor_range === floor_range && p.price === price
        ),
      clearAll: () => set({ properties: [] }),
    }),
    { name: 'shortlist-store' }
  )
)
