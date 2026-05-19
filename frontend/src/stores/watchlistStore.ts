import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WatchlistState {
  watchedIds: number[]
  addToWatchlist: (id: number) => void
  removeFromWatchlist: (id: number) => void
  isWatched: (id: number) => boolean
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      watchedIds: [],
      addToWatchlist: (id) =>
        set((s) => ({ watchedIds: s.watchedIds.includes(id) ? s.watchedIds : [...s.watchedIds, id] })),
      removeFromWatchlist: (id) =>
        set((s) => ({ watchedIds: s.watchedIds.filter((w) => w !== id) })),
      isWatched: (id) => get().watchedIds.includes(id),
    }),
    { name: 'watchlist-store' }
  )
)
