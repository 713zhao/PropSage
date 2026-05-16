import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type InvestorProfile, DEFAULT_PROFILE } from '../types/profile'

interface ProfileStore {
  profile: InvestorProfile
  isComplete: boolean
  setProfile: (updates: Partial<InvestorProfile>) => void
  resetProfile: () => void
}

function checkComplete(p: InvestorProfile): boolean {
  return p.annualIncomeSgd > 0 && p.purchasePriceBudget > 0
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      isComplete: false,
      setProfile: (updates) =>
        set((state) => {
          const updated = { ...state.profile, ...updates }
          return { profile: updated, isComplete: checkComplete(updated) }
        }),
      resetProfile: () => set({ profile: DEFAULT_PROFILE, isComplete: false }),
    }),
    { name: 'propsage-profile' }
  )
)
