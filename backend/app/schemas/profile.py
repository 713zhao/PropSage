from pydantic import BaseModel


class AffordabilityRequest(BaseModel):
    purchase_price: float
    gross_monthly_income: float
    existing_monthly_commitments: float = 0.0
    loan_tenure_years: int = 30
    existing_loan_count: int = 0
    is_hdb: bool = False


class AffordabilityResponse(BaseModel):
    max_loan: float
    min_down_payment: float
    min_cash_portion: float
    ltv_limit: float
    is_feasible: bool
    tdsr_ratio: float
    tdsr_pct: float
    tdsr_passes: bool
    msr_ratio: float | None
    msr_pct: float | None
    msr_passes: bool | None
