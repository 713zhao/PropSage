import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { getPPI, getRental, getVolume, PPIRecord, RentalRecord, VolumeRecord } from '../api/market'

export function MarketPage() {
  const [ppi, setPpi] = useState<PPIRecord[]>([])
  const [rental, setRental] = useState<RentalRecord[]>([])
  const [volume, setVolume] = useState<VolumeRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getPPI(), getRental(), getVolume()])
      .then(([p, r, v]) => {
        setPpi(p)
        setRental(r)
        setVolume(v)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const rentalCCR = rental.filter((r) => r.region === 'CCR')
  const rentalRCR = rental.filter((r) => r.region === 'RCR')
  const rentalOCR = rental.filter((r) => r.region === 'OCR')
  const rentalQuarters = [...new Set(rental.map((r) => r.quarter))].sort()
  const rentalChart = rentalQuarters.map((q) => ({
    quarter: q,
    CCR: rentalCCR.find((r) => r.quarter === q)?.index,
    RCR: rentalRCR.find((r) => r.quarter === q)?.index,
    OCR: rentalOCR.find((r) => r.quarter === q)?.index,
  }))

  if (loading) return <div className="p-8 text-gray-400">Loading market data…</div>
  if (error) return <div className="p-8 text-red-400">Error: {error}</div>

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold text-white">Market Intelligence</h1>

      {/* PPI Chart */}
      <section className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-medium text-white mb-4">Private Property Price Index (PPI)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={ppi}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="quarter" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
            <YAxis stroke="#9CA3AF" domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 6 }}
              labelStyle={{ color: '#F9FAFB' }}
            />
            <Line type="monotone" dataKey="index" stroke="#60A5FA" strokeWidth={2} dot={false} name="PPI" />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* Rental Index Chart */}
      <section className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-medium text-white mb-4">Rental Index by Region</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={rentalChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="quarter" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
            <YAxis stroke="#9CA3AF" domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 6 }}
              labelStyle={{ color: '#F9FAFB' }}
            />
            <Legend />
            <Line type="monotone" dataKey="CCR" stroke="#34D399" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="RCR" stroke="#FBBF24" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="OCR" stroke="#F87171" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* Volume Chart */}
      <section className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-medium text-white mb-4">Monthly Transaction Volume</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={volume}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
            <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: 6 }}
              labelStyle={{ color: '#F9FAFB' }}
            />
            <Legend />
            <Bar dataKey="new_sale" stackId="a" fill="#60A5FA" name="New Sale" />
            <Bar dataKey="sub_sale" stackId="a" fill="#FBBF24" name="Sub Sale" />
            <Bar dataKey="resale" stackId="a" fill="#34D399" name="Resale" />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  )
}
