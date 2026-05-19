from pydantic import BaseModel, Field


class BankPackage(BaseModel):
    bank: str
    package: str
    rate_type: str
    effective_rate_pct: float
    monthly_installment: float
    total_interest: float
    lock_in_years: int
    tdsr_pct: float | None
    tdsr_passes: bool | None


class LoanComparisonRequest(BaseModel):
    loan_amount: float = Field(gt=0)
    tenure_years: int = Field(default=25, ge=1, le=35)
    gross_monthly_income: float | None = None
    existing_monthly_commitments: float = 0.0


class LoanComparisonResponse(BaseModel):
    sora_rate_pct: float
    packages: list[BankPackage]


class RefinancingOption(BaseModel):
    bank: str
    package: str
    effective_rate_pct: float
    new_monthly_installment: float
    monthly_savings: float
    total_interest_savings: float
    break_even_months: int | None
    tdsr_pct: float | None
    tdsr_passes: bool | None


class RefinancingRequest(BaseModel):
    current_outstanding: float = Field(gt=0)
    current_rate_pct: float = Field(ge=0.0, le=20.0)
    remaining_years: int = Field(ge=1, le=35)
    penalty_amount: float = 0.0
    gross_monthly_income: float | None = None
    existing_monthly_commitments: float = 0.0


class RefinancingResponse(BaseModel):
    current_monthly_installment: float
    sora_rate_pct: float
    options: list[RefinancingOption]
