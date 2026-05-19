from pydantic import BaseModel, Field


class ROIRequest(BaseModel):
    purchase_price: float = Field(gt=0)
    loan_amount: float = Field(ge=0)
    annual_rate_pct: float = Field(default=3.5, ge=0.0, le=20.0)
    tenure_years: int = Field(default=25, ge=1, le=35)
    hold_years: int = Field(default=5, ge=1, le=35)
    monthly_rental_sgd: float = Field(default=0.0, ge=0.0)
    annual_appreciation_pct: float = Field(default=3.0, ge=-20.0, le=30.0)
    annual_expenses_pct: float = Field(default=1.0, ge=0.0, le=10.0)


class YearlyResult(BaseModel):
    year: int
    property_value: float
    rental_income: float
    mortgage_payment: float
    annual_expenses: float
    net_cashflow: float
    cumulative_cashflow: float
    loan_balance: float


class ScenarioResult(BaseModel):
    label: str
    total_return_pct: float
    irr_pct: float
    net_gain: float
    exit_value: float


class ROIResponse(BaseModel):
    down_payment: float
    yearly: list[YearlyResult]
    exit_value: float
    total_rental_income: float
    total_mortgage_paid: float
    total_expenses: float
    net_gain: float
    total_return_pct: float
    irr_pct: float
    scenarios: list[ScenarioResult]
