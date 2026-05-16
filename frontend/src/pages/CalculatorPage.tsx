import { useState } from 'react'
import { useProfileStore } from '../stores/profileStore'
import { calculateUpfrontCost, calculateSsd, type TaxResponse, type SSDResponse } from '../api/tax'
import { checkAffordability, type AffordabilityResponse } from '../api/profile'

function formatSgd(amount: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: 'warning' | 'danger' | 'total'
}) {
  const valueClass =
    highlight === 'danger'
      ? 'text-red-400 font-medium'
      : highlight === 'warning'
      ? 'text-yellow-400 font-medium'
      : highlight === 'total'
      ? 'text-blue-400 font-bold text-base'
      : 'text-gray-200'
  const labelClass =
    highlight === 'danger'
      ? 'text-red-400'
      : highlight === 'warning'
      ? 'text-yellow-400'
      : 'text-gray-400'
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
      <span className={`text-sm ${labelClass}`}>{label}</span>
      <span className={`text-sm ${valueClass}`}>{value}</span>
    </div>
  )
}

export function CalculatorPage() {
  const { profile } = useProfileStore()
  const [price, setPrice] = useState(profile.purchasePriceBudget || 1_000_000)
  const [renovation, setRenovation] = useState(0)
  const [holdYears, setHoldYears] = useState(5)
  const [tenure, setTenure] = useState(30)
  const [result, setResult] = useState<TaxResponse | null>(null)
  const [ssdResult, setSsdResult] = useState<SSDResponse | null>(null)
  const [affordResult, setAffordResult] = useState<AffordabilityResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const monthlyIncome = profile.annualIncomeSgd / 12

  async function handleCalculate() {
    setLoading(true)
    setError(null)
    try {
      const [tax, ssd, afford] = await Promise.all([
        calculateUpfrontCost({
          purchase_price: price,
          citizenship: profile.citizenship,
          existing_property_count: profile.existingPropertyCount,
          renovation_budget: renovation,
        }),
        calculateSsd({ purchase_price: price, hold_years: holdYears }),
        monthlyIncome > 0
          ? checkAffordability({
              purchase_price: price,
              gross_monthly_income: monthlyIncome,
              existing_monthly_commitments: profile.existingMonthlyLoanCommitments,
              loan_tenure_years: tenure,
              existing_loan_count: profile.existingPropertyCount,
              is_hdb: profile.propertyTypeOfInterest === 'HDB',
            })
          : Promise.resolve(null),
      ])
      setResult(tax)
      setSsdResult(ssd)
      setAffordResult(afford)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed — is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-blue-400">Tax & Cost Calculator</h1>
        <p className="text-sm text-gray-500 mt-1">
          Calculating for:{' '}
          <span className="text-gray-300">{profile.citizenship}</span>,{' '}
          <span className="text-gray-300">{profile.existingPropertyCount}</span> existing propert
          {profile.existingPropertyCount === 1 ? 'y' : 'ies'}
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Purchase Price (SGD)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Renovation Budget (SGD)</label>
            <input
              type="number"
              value={renovation || ''}
              onChange={(e) => setRenovation(Number(e.target.value))}
              placeholder="0"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Planned Hold Period (years)</label>
            <input
              type="number"
              value={holdYears}
              onChange={(e) => setHoldYears(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Loan Tenure (years)</label>
            <input
              type="number"
              value={tenure}
              onChange={(e) => setTenure(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <button
          onClick={handleCalculate}
          disabled={loading || price <= 0}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition-colors"
        >
          {loading ? 'Calculating...' : 'Calculate'}
        </button>
        {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
      </div>

      {result && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-base font-semibold text-gray-200 mb-3">Upfront Cost Breakdown</h2>
          <InfoRow label="Purchase Price" value={formatSgd(result.purchase_price)} />
          <InfoRow label="Buyer's Stamp Duty (BSD)" value={formatSgd(result.bsd)} />
          <InfoRow
            label={`Additional BSD (ABSD) — ${profile.citizenship}, property #${profile.existingPropertyCount + 1}`}
            value={formatSgd(result.absd)}
            highlight={result.absd > 0 ? 'warning' : undefined}
          />
          <InfoRow label="Legal Fees" value={formatSgd(result.legal_fees)} />
          <InfoRow label="Agent Commission (1%)" value={formatSgd(result.agent_commission)} />
          <InfoRow label="Valuation Fee" value={formatSgd(result.valuation_fee)} />
          {result.renovation_budget > 0 && (
            <InfoRow label="Renovation Budget" value={formatSgd(result.renovation_budget)} />
          )}
          <div className="pt-2">
            <InfoRow
              label="Total Cash Outlay"
              value={formatSgd(result.total_cash_outlay)}
              highlight="total"
            />
          </div>
        </div>
      )}

      {ssdResult && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-base font-semibold text-gray-200 mb-3">
            Seller's Stamp Duty — {holdYears} year hold
          </h2>
          <InfoRow
            label={`SSD Rate (${holdYears} yr hold)`}
            value={`${(ssdResult.ssd_rate * 100).toFixed(0)}%`}
            highlight={ssdResult.ssd > 0 ? 'warning' : undefined}
          />
          <InfoRow
            label="SSD Payable on Exit"
            value={formatSgd(ssdResult.ssd)}
            highlight={ssdResult.ssd > 0 ? 'danger' : undefined}
          />
          {ssdResult.ssd === 0 && (
            <p className="text-green-400 text-sm mt-2">
              ✓ No SSD — hold period exceeds 3 years
            </p>
          )}
        </div>
      )}

      {affordResult && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-base font-semibold text-gray-200 mb-3">Affordability Check</h2>
          <InfoRow label="Max Eligible Loan" value={formatSgd(affordResult.max_loan)} />
          <InfoRow label="Min Down Payment" value={formatSgd(affordResult.min_down_payment)} />
          <InfoRow
            label="Min Cash Portion (5% rule)"
            value={formatSgd(affordResult.min_cash_portion)}
          />
          <InfoRow label="LTV Limit" value={`${affordResult.ltv_limit}%`} />
          <InfoRow
            label={`TDSR — ${affordResult.tdsr_pct}% of income`}
            value={affordResult.tdsr_passes ? '✓ Pass' : '✗ Fail'}
            highlight={affordResult.tdsr_passes ? undefined : 'danger'}
          />
          {affordResult.msr_pct !== null && (
            <InfoRow
              label={`MSR (HDB) — ${affordResult.msr_pct}% of income`}
              value={affordResult.msr_passes ? '✓ Pass' : '✗ Fail'}
              highlight={affordResult.msr_passes ? undefined : 'danger'}
            />
          )}
          <div className="mt-3">
            <span
              className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                affordResult.is_feasible
                  ? 'bg-green-900/40 text-green-400 border border-green-700'
                  : 'bg-red-900/40 text-red-400 border border-red-700'
              }`}
            >
              {affordResult.is_feasible ? '✓ Loan is feasible' : '✗ Loan is not feasible at this price'}
            </span>
          </div>
        </div>
      )}

      {result && (
        <p className="text-xs text-gray-600 text-center pb-4">
          Indicative only — not financial advice. Consult a CEA-registered agent and financial advisor.
        </p>
      )}
    </div>
  )
}
