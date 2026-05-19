import { useState, useEffect } from 'react'
import { getDevelopments, type DevelopmentProfile } from '../api/enbloc'
import { useWatchlistStore } from '../stores/watchlistStore'

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 70 ? 'bg-red-500' : score >= 50 ? 'bg-yellow-500' : 'bg-green-600'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 bg-gray-700 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-medium text-gray-200 w-8 text-right">{score}</span>
    </div>
  )
}

function CscBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Approved: 'bg-green-900/40 text-green-400 border border-green-700',
    Pending: 'bg-yellow-900/40 text-yellow-400 border border-yellow-700',
    Lapsed: 'bg-gray-800 text-gray-500 border border-gray-700',
    None: 'bg-gray-900 text-gray-600 border border-gray-800',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${styles[status] ?? styles['None']}`}>
      {status === 'None' ? '—' : status}
    </span>
  )
}

function formatArea(sqft: number): string {
  return sqft >= 1_000_000
    ? `${(sqft / 43_560).toFixed(1)} ac`
    : `${Math.round(sqft / 1000)}k sqft`
}

export function EnblocPage() {
  const [devs, setDevs] = useState<DevelopmentProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'all' | 'watchlist'>('all')
  const { watchedIds, addToWatchlist, removeFromWatchlist, isWatched } = useWatchlistStore()

  useEffect(() => {
    getDevelopments()
      .then(setDevs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const displayed = tab === 'watchlist' ? devs.filter((d) => isWatched(d.id)) : devs

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-blue-400">En-Bloc Watch</h1>
        <p className="text-sm text-gray-500 mt-1">
          Developments ranked by en-bloc potential (0–100)
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            tab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          All Developments
        </button>
        <button
          onClick={() => setTab('watchlist')}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            tab === 'watchlist' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          My Watch List
          {watchedIds.length > 0 && (
            <span className="ml-1.5 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
              {watchedIds.length}
            </span>
          )}
        </button>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && displayed.length === 0 && tab === 'watchlist' && (
        <div className="bg-gray-900 rounded-lg p-8 border border-gray-800 text-center">
          <p className="text-gray-500">No developments on watch list. Click the star icon to track one.</p>
        </div>
      )}

      {displayed.length > 0 && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left w-6"></th>
                  <th className="px-4 py-3 text-left">Development</th>
                  <th className="px-4 py-3 text-left">District</th>
                  <th className="px-4 py-3 text-right">Age</th>
                  <th className="px-4 py-3 text-right">Units</th>
                  <th className="px-4 py-3 text-right">Land</th>
                  <th className="px-4 py-3 text-right">Plot Headroom</th>
                  <th className="px-4 py-3 text-center">CSC Status</th>
                  <th className="px-4 py-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((d) => (
                  <tr key={d.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() =>
                          isWatched(d.id) ? removeFromWatchlist(d.id) : addToWatchlist(d.id)
                        }
                        className={`text-base transition-colors ${
                          isWatched(d.id) ? 'text-yellow-400' : 'text-gray-700 hover:text-gray-400'
                        }`}
                        title={isWatched(d.id) ? 'Remove from watchlist' : 'Add to watchlist'}
                      >
                        ★
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-gray-200 font-medium">{d.name}</span>
                      {d.previous_csc_attempt && (
                        <span className="ml-2 text-xs text-purple-400">prev. CSC</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-400">{d.district}</td>
                    <td className="px-4 py-2.5 text-right text-gray-400">{d.age_years}y</td>
                    <td className="px-4 py-2.5 text-right text-gray-400">{d.ownership_units.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-gray-400">{formatArea(d.land_area_sqft)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-400">{d.plot_ratio_headroom.toFixed(0)}%</td>
                    <td className="px-4 py-2.5 text-center"><CscBadge status={d.csc_status} /></td>
                    <td className="px-4 py-2.5 text-right"><ScoreBar score={d.score} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <p className="text-xs text-gray-600">
          <strong className="text-gray-500">Score factors:</strong> Plot ratio headroom (25%), Age (20%), Land size (15%), Location (15%), Ownership fragmentation (10%), CSC history (10%), Lease remaining (5%). Scores are indicative; consult a property lawyer before making any investment decision.
        </p>
      </div>
    </div>
  )
}
