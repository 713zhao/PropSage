import { useState } from 'react'
import { searchTransactions, TransactionRecord, TransactionSearchRequest } from '../api/transactions'
import { useShortlistStore } from '../stores/shortlistStore'

const DISTRICTS = ['', '01', '02', '03', '04', '05', '09', '10', '11', '15', '19', '21', '23', '25', '26', '27', '28']
const PROPERTY_TYPES = ['', 'Condominium', 'Apartment', 'Semi-Detached House', 'Terrace House', 'Detached House']

const formatSgd = (n: number) =>
  new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 }).format(n)

export function TransactionPage() {
  const [filters, setFilters] = useState<TransactionSearchRequest>({ limit: 50 })
  const [results, setResults] = useState<TransactionRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const { addProperty, isShortlisted, properties } = useShortlistStore()

  const setField = <K extends keyof TransactionSearchRequest>(k: K, v: TransactionSearchRequest[K]) =>
    setFilters((f) => ({ ...f, [k]: v || undefined }))

  const handleSearch = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await searchTransactions(filters)
      setResults(data)
      setSearched(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-white">Transaction Search</h1>

      {/* Filter Form */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">District</label>
            <select
              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
              value={filters.district ?? ''}
              onChange={(e) => setField('district', e.target.value)}
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d || 'All Districts'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Property Type</label>
            <select
              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
              value={filters.property_type ?? ''}
              onChange={(e) => setField('property_type', e.target.value)}
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>{t || 'All Types'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Min Price (SGD)</label>
            <input
              type="number"
              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
              placeholder="e.g. 1000000"
              onChange={(e) => setField('min_price', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Max Price (SGD)</label>
            <input
              type="number"
              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
              placeholder="e.g. 3000000"
              onChange={(e) => setField('max_price', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Min PSF</label>
            <input
              type="number"
              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
              placeholder="e.g. 1500"
              onChange={(e) => setField('min_psf', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Max PSF</label>
            <input
              type="number"
              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
              placeholder="e.g. 4000"
              onChange={(e) => setField('max_psf', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="mt-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-6 py-2 rounded text-sm"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {/* Error */}
      {error && <div className="text-red-400 text-sm">{error}</div>}

      {/* Results Table */}
      {searched && (
        <div className="bg-gray-800 rounded-lg overflow-x-auto">
          <div className="px-4 py-3 border-b border-gray-700 text-sm text-gray-400">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </div>
          {results.length === 0 ? (
            <div className="p-6 text-gray-400 text-sm">No transactions found for the selected filters.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left px-4 py-3">Project</th>
                  <th className="text-left px-4 py-3">District</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-right px-4 py-3">Area (sqft)</th>
                  <th className="text-right px-4 py-3">Price</th>
                  <th className="text-right px-4 py-3">PSF</th>
                  <th className="text-left px-4 py-3">Tenure</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="px-4 py-3 w-10" title="Shortlist"></th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const saved = isShortlisted(r.project, r.floor_range, r.price)
                  const full = properties.length >= 10
                  return (
                    <tr key={i} className="border-b border-gray-700 hover:bg-gray-750 text-gray-200">
                      <td className="px-4 py-3 font-medium">{r.project}</td>
                      <td className="px-4 py-3">D{r.district}</td>
                      <td className="px-4 py-3">{r.property_type}</td>
                      <td className="px-4 py-3 text-right">{r.area_sqft.toFixed(0)}</td>
                      <td className="px-4 py-3 text-right">{formatSgd(r.price)}</td>
                      <td className="px-4 py-3 text-right">{formatSgd(r.psf)}</td>
                      <td className="px-4 py-3">{r.tenure}</td>
                      <td className="px-4 py-3">{r.sale_date}</td>
                      <td className="px-4 py-3 text-center">
                        {saved ? (
                          <span title="Saved to shortlist" className="text-base select-none">🔖</span>
                        ) : full ? (
                          <span title="Shortlist full (10/10)" className="text-base opacity-30 select-none">🏷️</span>
                        ) : (
                          <button
                            title="Add to shortlist"
                            onClick={() =>
                              addProperty({
                                project: r.project,
                                street: r.street,
                                district: r.district,
                                area_sqft: r.area_sqft,
                                price: r.price,
                                psf: r.psf,
                                floor_range: r.floor_range,
                                tenure: r.tenure,
                                property_type: r.property_type,
                              })
                            }
                            className="text-base hover:scale-125 transition-transform"
                          >
                            🏷️
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
