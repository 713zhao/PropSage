import { useProfileStore } from '../stores/profileStore'
import {
  type Citizenship,
  type PropertyType,
  type RiskProfile,
  type InvestmentGoal,
  type InvestmentHorizon,
} from '../types/profile'

const CITIZENSHIPS: Citizenship[] = ['SC', 'PR', 'Foreigner', 'Entity']
const PROPERTY_TYPES: PropertyType[] = ['HDB', 'Condo', 'Landed', 'Commercial']
const RISK_PROFILES: RiskProfile[] = ['Conservative', 'Moderate', 'Aggressive']
const HORIZONS: { value: InvestmentHorizon; label: string }[] = [
  { value: 'Short', label: 'Short (≤3 yrs)' },
  { value: 'Mid', label: 'Mid (5 yrs)' },
  { value: 'Long', label: 'Long (10+ yrs)' },
]
const INVESTMENT_GOALS: InvestmentGoal[] = [
  'Capital Appreciation',
  'Rental Yield',
  'Own-Stay + Asset Building',
  'En-Bloc Potential',
  'Portfolio Diversification',
]

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h2 className="text-base font-semibold text-gray-200 mb-4">{title}</h2>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm text-gray-400 mb-1">{children}</label>
}

function NumberInput({
  value,
  onChange,
  placeholder,
}: {
  value: number
  onChange: (v: number) => void
  placeholder?: string
}) {
  return (
    <input
      type="number"
      value={value || ''}
      onChange={(e) => onChange(Number(e.target.value))}
      placeholder={placeholder}
      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
    />
  )
}

function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[] | T[]
}) {
  const normalised = options.map((o) =>
    typeof o === 'string' ? { value: o as T, label: o } : o
  )
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
    >
      {normalised.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function ProfilePage() {
  const { profile, setProfile, isComplete } = useProfileStore()

  function toggleGoal(goal: InvestmentGoal) {
    const goals = profile.investmentGoals.includes(goal)
      ? profile.investmentGoals.filter((g) => g !== goal)
      : [...profile.investmentGoals, goal]
    setProfile({ investmentGoals: goals })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-blue-400">Investor Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          All fields are saved automatically to your browser. No account needed.
        </p>
      </div>

      <SectionCard title="Personal & Financial Details">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Citizenship Status</Label>
            <Select
              value={profile.citizenship}
              onChange={(v) => setProfile({ citizenship: v })}
              options={CITIZENSHIPS}
            />
          </div>
          <div>
            <Label>Properties Currently Owned</Label>
            <Select
              value={String(profile.existingPropertyCount) as '0' | '1' | '2'}
              onChange={(v) => setProfile({ existingPropertyCount: Number(v) })}
              options={[
                { value: '0', label: '0 — first property' },
                { value: '1', label: '1 — second property' },
                { value: '2', label: '2+ — third or more' },
              ]}
            />
          </div>
          <div>
            <Label>Annual Income (SGD)</Label>
            <NumberInput
              value={profile.annualIncomeSgd}
              onChange={(v) => setProfile({ annualIncomeSgd: v })}
              placeholder="e.g. 120000"
            />
          </div>
          <div>
            <Label>CPF OA Balance (SGD)</Label>
            <NumberInput
              value={profile.cpfOaBalance}
              onChange={(v) => setProfile({ cpfOaBalance: v })}
              placeholder="e.g. 80000"
            />
          </div>
          <div>
            <Label>Existing Monthly Loan Commitments (SGD)</Label>
            <NumberInput
              value={profile.existingMonthlyLoanCommitments}
              onChange={(v) => setProfile({ existingMonthlyLoanCommitments: v })}
              placeholder="e.g. 1500"
            />
          </div>
          <div>
            <Label>Property Type of Interest</Label>
            <Select
              value={profile.propertyTypeOfInterest}
              onChange={(v) => setProfile({ propertyTypeOfInterest: v })}
              options={PROPERTY_TYPES}
            />
          </div>
          <div>
            <Label>Budget (SGD)</Label>
            <NumberInput
              value={profile.purchasePriceBudget}
              onChange={(v) => setProfile({ purchasePriceBudget: v })}
              placeholder="e.g. 1500000"
            />
          </div>
          <div>
            <Label>Investment Horizon</Label>
            <Select
              value={profile.investmentHorizon}
              onChange={(v) => setProfile({ investmentHorizon: v })}
              options={HORIZONS}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Risk Profile">
        <div className="flex gap-3">
          {RISK_PROFILES.map((r) => (
            <button
              key={r}
              onClick={() => setProfile({ riskProfile: r })}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium border transition-colors ${
                profile.riskProfile === r
                  ? 'bg-blue-900/40 border-blue-500 text-blue-400'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Investment Goals">
        <div className="flex flex-wrap gap-2">
          {INVESTMENT_GOALS.map((goal) => {
            const selected = profile.investmentGoals.includes(goal)
            return (
              <button
                key={goal}
                onClick={() => toggleGoal(goal)}
                className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                  selected
                    ? 'bg-green-900/40 border-green-500 text-green-400'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                {goal}
              </button>
            )
          })}
        </div>
      </SectionCard>

      <div
        className={`rounded-lg p-4 text-sm border ${
          isComplete
            ? 'bg-green-900/20 border-green-800 text-green-400'
            : 'bg-yellow-900/20 border-yellow-800 text-yellow-400'
        }`}
      >
        {isComplete
          ? '✓ Profile complete — your data is saved to this browser'
          : '⚠ Enter your annual income and budget to complete your profile'}
      </div>
    </div>
  )
}
