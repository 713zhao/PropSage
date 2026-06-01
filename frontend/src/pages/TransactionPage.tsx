import { useState, useEffect } from 'react'
import { TransactionRecord, TransactionSearchRequest } from '../api/transactions'
import { useShortlistStore } from '../stores/shortlistStore'
import { ANALYSIS_API_URL } from '../config/analysisApi'

const DISTRICTS = ['', '01', '02', '03', '04', '05', '09', '10', '11', '15', '19', '21', '23', '25', '26', '27', '28']
const PROPERTY_TYPES = ['', 'Condominium', 'Apartment', 'Semi-Detached House', 'Terrace House', 'Detached House', 'HDB']

const formatSgd = (n: number) =>
  new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 }).format(n)

export function TransactionPage() {
  const [filters, setFilters] = useState<TransactionSearchRequest>({ limit: 50 })
  const [results, setResults] = useState<TransactionRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const { addProperty, isShortlisted, properties } = useShortlistStore()

  useEffect(() => {
    // Initial load with latest data
    handleSearch()
  }, [])

  const setField = <K extends keyof TransactionSearchRequest>(k: K, v: TransactionSearchRequest[K]) =>
    setFilters((f) => ({ ...f, [k]: v || undefined }))

  const handleSearch = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters.district) params.append('district', filters.district)
      if (filters.property_type) params.append('property_type', filters.property_type)
      if (filters.min_price) params.append('min_price', filters.min_price.toString())
      if (filters.max_price) params.append('max_price', filters.max_price.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      const res = await fetch(`${ANALYSIS_API_URL}/api/transactions?${params.toString()}`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      
      // Map API response to TransactionRecord if field names differ
      const mappedData: TransactionRecord[] = data.map((r: any) => {
        const price = Number(r.price) || 0
        const area = Number(r.size_sqft) || 1
        const psf = Number(r.psf) || (price / area)
        
        return {
          project: r.project || 'Unknown Project',
          street: r.street || '',
          district: r.district || '',
          area_sqft: area,
          price: price,
          psf: psf,
          floor_range: r.floor_range || '-',
          tenure: r.tenure || '-',
          sale_date: r.date || '',
          property_type: r.property_type || 'Private'
        }
      })

      setResults(mappedData)
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
                  <th className="text-left px-4 py-3">Project Name</th>
                  <th className="text-left px-4 py-3">Address</th>
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
                      <td className="px-4 py-3 font-bold text-white">{r.project}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs uppercase">{r.street}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-gray-700 rounded text-[10px] text-gray-300">
                          {r.district ? (r.district.match(/^\d+$/) ? `D${r.district}` : r.district) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.property_type === 'HDB' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {r.property_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{r.area_sqft.toFixed(0)}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-400">{formatSgd(r.price)}</td>
                      <td className="px-4 py-3 text-right font-mono text-blue-400">{formatSgd(r.psf)}</td>
                      <td className="px-4 py-3 text-[10px] text-gray-400">{r.tenure}</td>
                      <td className="px-4 py-3 font-medium">{r.sale_date}</td>
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
