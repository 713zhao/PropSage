import { useState } from 'react'
import { useShortlistStore, type ShortlistedProperty } from '../stores/shortlistStore'
import { useProfileStore } from '../stores/profileStore'

function formatSgd(n: number): string {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 }).format(n)
}

function computeMonthlyInstallment(price: number): number {
  const loan = price * 0.75
  const r = 0.035 / 12
  const n = 25 * 12
  return loan * (r * (1 + r) ** n) / ((1 + r) ** n - 1)
}

function computeVerdict(
  p: ShortlistedProperty,
  monthlyIncome: number,
  existingCommitments: number,
  budget: number
): { label: 'Buy' | 'Watch' | 'Pass'; color: string } {
  const installment = computeMonthlyInstallment(p.price)
  const totalCommitments = installment + existingCommitments

  if (p.price > budget * 1.25) {
    return { label: 'Pass', color: 'text-red-400 bg-red-900/30 border-red-700' }
  }
  if (monthlyIncome > 0) {
    const tdsr = totalCommitments / monthlyIncome
    if (tdsr > 0.55) return { label: 'Pass', color: 'text-red-400 bg-red-900/30 border-red-700' }
    if (tdsr > 0.40) return { label: 'Watch', color: 'text-yellow-400 bg-yellow-900/30 border-yellow-700' }
    return { label: 'Buy', color: 'text-green-400 bg-green-900/30 border-green-700' }
  }
  if (p.price > budget) {
    return { label: 'Watch', color: 'text-yellow-400 bg-yellow-900/30 border-yellow-700' }
  }
  return { label: 'Buy', color: 'text-green-400 bg-green-900/30 border-green-700' }
}

function PropertyCard({ p, onRemove }: { p: ShortlistedProperty; onRemove: () => void }) {
  const { profile } = useProfileStore()
  const monthlyIncome = profile.annualIncomeSgd / 12
  const verdict = computeVerdict(p, monthlyIncome, profile.existingMonthlyLoanCommitments, profile.purchasePriceBudget)
  const installment = computeMonthlyInstallment(p.price)

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 relative">
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 text-gray-600 hover:text-red-400 text-xs"
        title="Remove from shortlist"
      >
        ✕
      </button>
      <div className="pr-6">
        <p className="text-gray-100 font-semibold text-sm leading-tight">{p.project}</p>
        <p className="text-gray-500 text-xs mt-0.5">{p.street} · {p.district}</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="text-gray-500">Price</span>
        <span className="text-gray-200 font-medium">{formatSgd(p.price)}</span>
        <span className="text-gray-500">PSF</span>
        <span className="text-gray-200">{formatSgd(p.psf)}</span>
        <span className="text-gray-500">Area</span>
        <span className="text-gray-200">{p.area_sqft.toLocaleString()} sqft</span>
        <span className="text-gray-500">Floor</span>
        <span className="text-gray-200">{p.floor_range}</span>
        <span className="text-gray-500">Tenure</span>
        <span className="text-gray-200 truncate">{p.tenure}</span>
        <span className="text-gray-500">Monthly</span>
        <span className="text-gray-200">{formatSgd(installment)}/mo</span>
      </div>
      <div className="mt-3">
        <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${verdict.color}`}>
          {verdict.label}
        </span>
        <span className="ml-2 text-xs text-gray-600">at 75% LTV, 25y</span>
      </div>
    </div>
  )
}

export function ShortlistPage() {
  const { properties, removeProperty, clearAll } = useShortlistStore()
  const [view, setView] = useState<'cards' | 'compare'>('cards')
  const { profile } = useProfileStore()
  const monthlyIncome = profile.annualIncomeSgd / 12

  if (properties.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-blue-400">Shortlist</h1>
        <p className="text-sm text-gray-500 mt-1">Save properties from the Transactions page to compare here.</p>
        <div className="mt-8 bg-gray-900 rounded-lg border border-gray-800 p-10 text-center">
          <p className="text-gray-500 text-lg">No properties saved yet.</p>
          <p className="text-gray-600 text-sm mt-2">
            Browse Transactions and click the bookmark icon to save up to 10 properties.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-400">Shortlist</h1>
          <p className="text-sm text-gray-500 mt-1">
            {properties.length}/10 properties saved
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setView('cards')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${view === 'cards' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
          >
            Cards
          </button>
          <button
            onClick={() => setView('compare')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${view === 'compare' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
          >
            Compare
          </button>
          <button
            onClick={() => { if (confirm('Clear all shortlisted properties?')) clearAll() }}
            className="px-3 py-1 rounded text-sm text-gray-600 hover:text-red-400 transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>

      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <PropertyCard key={p.id} p={p} onRemove={() => removeProperty(p.id)} />
          ))}
        </div>
      )}

      {view === 'compare' && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-x-auto">
          <table className="text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-gray-500 text-xs uppercase w-32">Attribute</th>
                {properties.map((p) => (
                  <th key={p.id} className="px-4 py-3 text-left min-w-[160px]">
                    <p className="text-gray-200 font-semibold text-xs leading-tight">{p.project}</p>
                    <p className="text-gray-600 text-xs">{p.district}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Price', fn: (p: ShortlistedProperty) => formatSgd(p.price) },
                { label: 'PSF', fn: (p: ShortlistedProperty) => formatSgd(p.psf) },
                { label: 'Area (sqft)', fn: (p: ShortlistedProperty) => p.area_sqft.toLocaleString() },
                { label: 'Floor', fn: (p: ShortlistedProperty) => p.floor_range },
                { label: 'Tenure', fn: (p: ShortlistedProperty) => p.tenure },
                { label: 'Type', fn: (p: ShortlistedProperty) => p.property_type },
                {
                  label: 'Monthly (75% LTV, 25y)',
                  fn: (p: ShortlistedProperty) => formatSgd(computeMonthlyInstallment(p.price)) + '/mo',
                },
                {
                  label: 'TDSR%',
                  fn: (p: ShortlistedProperty) => {
                    if (monthlyIncome <= 0) return '—'
                    const tdsr = (computeMonthlyInstallment(p.price) + profile.existingMonthlyLoanCommitments) / monthlyIncome
                    return `${(tdsr * 100).toFixed(1)}%`
                  },
                },
                {
                  label: 'Verdict',
                  fn: (p: ShortlistedProperty) => {
                    const v = computeVerdict(p, monthlyIncome, profile.existingMonthlyLoanCommitments, profile.purchasePriceBudget)
                    return v.label
                  },
                },
              ].map((row) => (
                <tr key={row.label} className="border-b border-gray-800/50">
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{row.label}</td>
                  {properties.map((p) => {
                    const val = row.fn(p)
                    const isBuy = val === 'Buy'
                    const isPass = val === 'Pass'
                    return (
                      <td
                        key={p.id}
                        className={`px-4 py-2.5 text-xs font-medium ${
                          isBuy ? 'text-green-400' : isPass ? 'text-red-400' : 'text-gray-300'
                        }`}
                      >
                        {val}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-600 text-center pb-4">
        Verdict based on TDSR at 75% LTV, 3.5% rate, 25-year tenure. Indicative only — not financial advice.
      </p>
    </div>
  )
}
