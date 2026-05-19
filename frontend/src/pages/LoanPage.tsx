import { useState } from 'react'
import { compareLoans, refinanceLoans, type LoanComparisonResponse, type RefinancingResponse } from '../api/loans'

function formatSgd(amount: number): string {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 }).format(amount)
}

function TdsrBadge({ passes, pct }: { passes: boolean | null; pct: number | null }) {
  if (passes === null || pct === null) {
    return <span className="text-gray-600 text-xs">—</span>
  }
  return (
    <span
      className={`text-xs px-1.5 py-0.5 rounded font-medium ${
        passes ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
      }`}
    >
      {pct}%
    </span>
  )
}

function RateBadge({ rateType }: { rateType: string }) {
  return (
    <span
      className={`text-xs px-1.5 py-0.5 rounded ${
        rateType === 'fixed' ? 'bg-blue-900/40 text-blue-400' : 'bg-purple-900/40 text-purple-400'
      }`}
    >
      {rateType === 'fixed' ? 'Fixed' : 'SORA'}
    </span>
  )
}

export function LoanPage() {
  const [tab, setTab] = useState<'compare' | 'refinance'>('compare')

  // Compare form
  const [loanAmount, setLoanAmount] = useState(750_000)
  const [tenure, setTenure] = useState(25)
  const [income, setIncome] = useState(0)
  const [commitments, setCommitments] = useState(0)
  const [compareResult, setCompareResult] = useState<LoanComparisonResponse | null>(null)

  // Refinance form
  const [outstanding, setOutstanding] = useState(500_000)
  const [currentRate, setCurrentRate] = useState(4.5)
  const [remainingYears, setRemainingYears] = useState(20)
  const [penalty, setPenalty] = useState(0)
  const [refIncome, setRefIncome] = useState(0)
  const [refResult, setRefResult] = useState<RefinancingResponse | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCompare() {
    setLoading(true)
    setError(null)
    try {
      const result = await compareLoans({
        loan_amount: loanAmount,
        tenure_years: tenure,
        gross_monthly_income: income > 0 ? income : undefined,
        existing_monthly_commitments: commitments,
      })
      setCompareResult(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleRefinance() {
    setLoading(true)
    setError(null)
    try {
      const result = await refinanceLoans({
        current_outstanding: outstanding,
        current_rate_pct: currentRate,
        remaining_years: remainingYears,
        penalty_amount: penalty,
        gross_monthly_income: refIncome > 0 ? refIncome : undefined,
      })
      setRefResult(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-blue-400">Loan Compare</h1>
        <p className="text-sm text-gray-500 mt-1">Compare packages from 10 banks</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('compare')}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            tab === 'compare' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          New Loan
        </button>
        <button
          onClick={() => setTab('refinance')}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            tab === 'refinance' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          Refinancing
        </button>
      </div>

      {tab === 'compare' && (
        <>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Loan Amount (SGD)</label>
                <input type="number" value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Loan Tenure (years)</label>
                <input type="number" value={tenure} onChange={(e) => setTenure(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Monthly Income (SGD, optional)</label>
                <input type="number" value={income || ''} onChange={(e) => setIncome(Number(e.target.value))} placeholder="0"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Existing Commitments (SGD/mo)</label>
                <input type="number" value={commitments || ''} onChange={(e) => setCommitments(Number(e.target.value))} placeholder="0"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <button onClick={handleCompare} disabled={loading || loanAmount <= 0}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition-colors">
              {loading ? 'Loading...' : 'Compare Loans'}
            </button>
            {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
          </div>

          {compareResult && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="px-6 py-3 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-200">20 Packages — sorted by installment</h2>
                <span className="text-xs text-gray-500">SORA 3M: {compareResult.sora_rate_pct}%</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Bank</th>
                      <th className="px-4 py-3 text-left">Package</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-right">Rate</th>
                      <th className="px-4 py-3 text-right">Monthly</th>
                      <th className="px-4 py-3 text-right">Total Interest</th>
                      <th className="px-4 py-3 text-right">Lock-in</th>
                      <th className="px-4 py-3 text-right">TDSR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareResult.packages.map((pkg, i) => (
                      <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="px-4 py-2.5 text-gray-300 font-medium">{pkg.bank}</td>
                        <td className="px-4 py-2.5 text-gray-400">{pkg.package}</td>
                        <td className="px-4 py-2.5"><RateBadge rateType={pkg.rate_type} /></td>
                        <td className="px-4 py-2.5 text-right text-gray-300">{pkg.effective_rate_pct}%</td>
                        <td className="px-4 py-2.5 text-right text-gray-100 font-medium">{formatSgd(pkg.monthly_installment)}</td>
                        <td className="px-4 py-2.5 text-right text-gray-400">{formatSgd(pkg.total_interest)}</td>
                        <td className="px-4 py-2.5 text-right text-gray-500">{pkg.lock_in_years > 0 ? `${pkg.lock_in_years}Y` : '—'}</td>
                        <td className="px-4 py-2.5 text-right"><TdsrBadge passes={pkg.tdsr_passes} pct={pkg.tdsr_pct} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'refinance' && (
        <>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Outstanding Loan (SGD)</label>
                <input type="number" value={outstanding} onChange={(e) => setOutstanding(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Current Rate (%)</label>
                <input type="number" step="0.1" value={currentRate} onChange={(e) => setCurrentRate(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Remaining Tenure (years)</label>
                <input type="number" value={remainingYears} onChange={(e) => setRemainingYears(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Penalty (SGD, optional)</label>
                <input type="number" value={penalty || ''} onChange={(e) => setPenalty(Number(e.target.value))} placeholder="0"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Monthly Income (SGD, optional)</label>
                <input type="number" value={refIncome || ''} onChange={(e) => setRefIncome(Number(e.target.value))} placeholder="0"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <button onClick={handleRefinance} disabled={loading || outstanding <= 0}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition-colors">
              {loading ? 'Loading...' : 'Find Refinancing Options'}
            </button>
            {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
          </div>

          {refResult && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="px-6 py-3 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-200">Refinancing Options</h2>
                <span className="text-xs text-gray-500">
                  Current: {formatSgd(refResult.current_monthly_installment)}/mo
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Bank</th>
                      <th className="px-4 py-3 text-left">Package</th>
                      <th className="px-4 py-3 text-right">Rate</th>
                      <th className="px-4 py-3 text-right">New Monthly</th>
                      <th className="px-4 py-3 text-right">Monthly Savings</th>
                      <th className="px-4 py-3 text-right">Total Savings</th>
                      <th className="px-4 py-3 text-right">Break Even</th>
                      <th className="px-4 py-3 text-right">TDSR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refResult.options.map((opt, i) => (
                      <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="px-4 py-2.5 text-gray-300 font-medium">{opt.bank}</td>
                        <td className="px-4 py-2.5 text-gray-400">{opt.package}</td>
                        <td className="px-4 py-2.5 text-right text-gray-300">{opt.effective_rate_pct}%</td>
                        <td className="px-4 py-2.5 text-right text-gray-100 font-medium">{formatSgd(opt.new_monthly_installment)}</td>
                        <td className={`px-4 py-2.5 text-right font-medium ${opt.monthly_savings > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {opt.monthly_savings > 0 ? '+' : ''}{formatSgd(opt.monthly_savings)}
                        </td>
                        <td className={`px-4 py-2.5 text-right ${opt.total_interest_savings > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatSgd(opt.total_interest_savings)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-500">
                          {opt.break_even_months != null ? `${opt.break_even_months}mo` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right"><TdsrBadge passes={opt.tdsr_passes} pct={opt.tdsr_pct} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
