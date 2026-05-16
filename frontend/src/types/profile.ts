export type Citizenship = 'SC' | 'PR' | 'Foreigner' | 'Entity'
export type PropertyType = 'HDB' | 'Condo' | 'Landed' | 'Commercial'
export type RiskProfile = 'Conservative' | 'Moderate' | 'Aggressive'
export type InvestmentHorizon = 'Short' | 'Mid' | 'Long'
export type InvestmentGoal =
  | 'Capital Appreciation'
  | 'Rental Yield'
  | 'Own-Stay + Asset Building'
  | 'En-Bloc Potential'
  | 'Portfolio Diversification'

export interface InvestorProfile {
  citizenship: Citizenship
  existingPropertyCount: number
  annualIncomeSgd: number
  cpfOaBalance: number
  existingMonthlyLoanCommitments: number
  propertyTypeOfInterest: PropertyType
  purchasePriceBudget: number
  investmentHorizon: InvestmentHorizon
  investmentGoals: InvestmentGoal[]
  riskProfile: RiskProfile
}

export const DEFAULT_PROFILE: InvestorProfile = {
  citizenship: 'SC',
  existingPropertyCount: 0,
  annualIncomeSgd: 0,
  cpfOaBalance: 0,
  existingMonthlyLoanCommitments: 0,
  propertyTypeOfInterest: 'Condo',
  purchasePriceBudget: 1_000_000,
  investmentHorizon: 'Mid',
  investmentGoals: [],
  riskProfile: 'Moderate',
}
