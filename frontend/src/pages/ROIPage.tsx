import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { calculateROI, type ROIResponse } from '../api/roi'

function formatSgd(amount: number): string {
  return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 }).format(amount)
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-gray-100 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

export function ROIPage() {
  const [purchasePrice, setPurchasePrice] = useState(1_000_000)
  const [loanAmount, setLoanAmount] = useState(750_000)
  const [annualRate, setAnnualRate] = useState(3.5)
  const [tenureYears, setTenureYears] = useState(25)
  const [holdYears, setHoldYears] = useState(5)
  const [monthlyRental, setMonthlyRental] = useState(3_000)
  const [appreciation, setAppreciation] = useState(3.0)
  const [expenses, setExpenses] = useState(1.0)
  const [result, setResult] = useState<ROIResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCalculate() {
    setLoading(true)
    setError(null)
    try {
      const r = await calculateROI({
        purchase_price: purchasePrice,
        loan_amount: loanAmount,
        annual_rate_pct: annualRate,
        tenure_years: tenureYears,
        hold_years: holdYears,
        monthly_rental_sgd: monthlyRental,
        annual_appreciation_pct: appreciation,
        annual_expenses_pct: expenses,
      })
      setResult(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed')
    } finally {
      setLoading(false)
    }
  }

  const chartData = result?.yearly.map((y) => ({
    year: `Yr ${y.year}`,
    cashflow: Math.round(y.cumulative_cashflow),
  }))

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-blue-400">ROI Projector</h1>
        <p className="text-sm text-gray-500 mt-1">Model cumulative returns across hold periods and scenarios</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Purchase Price (SGD)</label>
            <input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Loan Amount (SGD)</label>
            <input type="number" value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Interest Rate (%)</label>
            <input type="number" step="0.1" value={annualRate} onChange={(e) => setAnnualRate(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Loan Tenure (years)</label>
            <input type="number" value={tenureYears} onChange={(e) => setTenureYears(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Hold Period (years)</label>
            <input type="number" value={holdYears} onChange={(e) => setHoldYears(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Monthly Rental (SGD)</label>
            <input type="number" value={monthlyRental} onChange={(e) => setMonthlyRental(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Annual Appreciation (%)</label>
            <input type="number" step="0.5" value={appreciation} onChange={(e) => setAppreciation(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Annual Expenses (% of value)</label>
            <input type="number" step="0.1" value={expenses} onChange={(e) => setExpenses(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <button onClick={handleCalculate} disabled={loading || purchasePrice <= 0}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition-colors">
          {loading ? 'Calculating...' : 'Calculate ROI'}
        </button>
        {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
      </div>

      {result && (
        <>
          <div className="grid grid-cols-4 gap-3">
            <SummaryCard label="Exit Value" value={formatSgd(result.exit_value)} />
            <SummaryCard label="Net Gain" value={formatSgd(result.net_gain)} />
            <SummaryCard label="Total Return" value={`${result.total_return_pct.toFixed(1)}%`} sub={`over ${holdYears} yr`} />
            <SummaryCard label="IRR" value={`${result.irr_pct.toFixed(1)}%`} sub="annualised" />
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-base font-semibold text-gray-200 mb-4">Cumulative Cashflow</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="year" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip formatter={(v) => typeof v === 'number' ? formatSgd(v) : v} contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6 }} labelStyle={{ color: '#e5e7eb' }} />
                <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="cashflow" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-800">
              <h2 className="text-base font-semibold text-gray-200">Scenario Sensitivity</h2>
              <p className="text-xs text-gray-500 mt-0.5">Bear: apprec −2%, rental ×0.9 · Bull: apprec +2%, rental ×1.1</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-3 text-left">Scenario</th>
                  <th className="px-6 py-3 text-right">Exit Value</th>
                  <th className="px-6 py-3 text-right">Net Gain</th>
                  <th className="px-6 py-3 text-right">Total Return</th>
                  <th className="px-6 py-3 text-right">IRR</th>
                </tr>
              </thead>
              <tbody>
                {result.scenarios.map((s) => {
                  const color = s.label === 'Bull' ? 'text-green-400' : s.label === 'Bear' ? 'text-red-400' : 'text-blue-400'
                  return (
                    <tr key={s.label} className="border-b border-gray-800/50">
                      <td className={`px-6 py-3 font-medium ${color}`}>{s.label}</td>
                      <td className="px-6 py-3 text-right text-gray-300">{formatSgd(s.exit_value)}</td>
                      <td className={`px-6 py-3 text-right font-medium ${s.net_gain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {s.net_gain >= 0 ? '+' : ''}{formatSgd(s.net_gain)}
                      </td>
                      <td className={`px-6 py-3 text-right ${s.total_return_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {s.total_return_pct >= 0 ? '+' : ''}{s.total_return_pct.toFixed(1)}%
                      </td>
                      <td className={`px-6 py-3 text-right ${s.irr_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {s.irr_pct.toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-600 text-center pb-4">
            Indicative only — not financial advice. Consult a CEA-registered agent and financial advisor.
          </p>
        </>
      )}
    </div>
  )
}
