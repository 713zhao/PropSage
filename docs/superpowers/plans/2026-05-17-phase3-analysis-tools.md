# Phase 3 — Analysis Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add loan comparison, ROI projector, and refinancing calculator pages to PropSage.

**Architecture:** Three backend service modules (loans, roi) with two routers, each following the existing FastAPI pattern. Two new React pages (LoanPage, ROIPage) consume the new endpoints. No new database tables — all data is stateless computation or static seed data.

**Tech Stack:** Python FastAPI 0.115, Pydantic v2, pytest + httpx; React 18 + TypeScript + Vite + Recharts; existing `monthly_payment()` from `affordability.py` reused throughout.

---

## File Structure

**Backend (new):**
- `backend/app/schemas/loans.py` — Pydantic request/response models for loan comparison + refinancing
- `backend/app/schemas/roi.py` — Pydantic request/response models for ROI projector
- `backend/app/services/loans.py` — Static bank package data, compare_loans(), calculate_refinancing()
- `backend/app/services/roi.py` — IRR via bisection, calculate_roi() with 3 scenarios
- `backend/app/routers/loans.py` — POST /api/loans/compare + POST /api/loans/refinance
- `backend/app/routers/roi.py` — POST /api/roi/calculate

**Backend (modified):**
- `backend/app/main.py` — include loans + roi routers

**Frontend (new):**
- `frontend/src/api/loans.ts` — TypeScript types + API calls for loan endpoints
- `frontend/src/api/roi.ts` — TypeScript types + API calls for ROI endpoint
- `frontend/src/pages/LoanPage.tsx` — Loan comparison table + refinancing calculator
- `frontend/src/pages/ROIPage.tsx` — ROI projector with chart + scenario table

**Frontend (modified):**
- `frontend/src/App.tsx` — replace /loans and /roi ComingSoon with real pages

---

### Task 1: Loan Schemas + Service

**Files:**
- Create: `backend/app/schemas/loans.py`
- Create: `backend/app/services/loans.py`
- Create: `backend/tests/test_loans_service.py`

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_loans_service.py
import pytest
from app.services.loans import get_sora_rate, compare_loans, calculate_refinancing
from app.schemas.loans import LoanComparisonRequest, RefinancingRequest


def test_get_sora_rate_returns_float():
    rate = get_sora_rate()
    assert isinstance(rate, float)
    assert 0.0 < rate < 10.0


def test_compare_loans_returns_20_packages():
    req = LoanComparisonRequest(loan_amount=800_000, tenure_years=25)
    resp = compare_loans(req)
    assert len(resp.packages) == 20
    assert resp.sora_rate_pct == pytest.approx(3.68)


def test_compare_loans_sorted_by_installment():
    req = LoanComparisonRequest(loan_amount=800_000, tenure_years=25)
    resp = compare_loans(req)
    installments = [p.monthly_installment for p in resp.packages]
    assert installments == sorted(installments)


def test_compare_loans_tdsr_pass_with_income():
    req = LoanComparisonRequest(
        loan_amount=500_000,
        tenure_years=25,
        gross_monthly_income=15_000,
        existing_monthly_commitments=0.0,
    )
    resp = compare_loans(req)
    for p in resp.packages:
        assert p.tdsr_pct is not None
        assert p.tdsr_passes is not None


def test_compare_loans_no_tdsr_without_income():
    req = LoanComparisonRequest(loan_amount=800_000, tenure_years=25)
    resp = compare_loans(req)
    for p in resp.packages:
        assert p.tdsr_pct is None
        assert p.tdsr_passes is None


def test_refinancing_calculates_savings():
    req = RefinancingRequest(
        current_outstanding=500_000,
        current_rate_pct=4.5,
        remaining_years=20,
        penalty_amount=0.0,
        gross_monthly_income=15_000,
    )
    resp = calculate_refinancing(req)
    assert resp.current_monthly_installment > 0
    assert len(resp.options) == 20
    # At least some options should save money vs 4.5% rate
    savings = [o for o in resp.options if o.monthly_savings > 0]
    assert len(savings) > 0


def test_refinancing_break_even_none_when_no_penalty():
    req = RefinancingRequest(
        current_outstanding=500_000,
        current_rate_pct=4.5,
        remaining_years=20,
        penalty_amount=0.0,
    )
    resp = calculate_refinancing(req)
    for o in resp.options:
        assert o.break_even_months is None


def test_refinancing_break_even_calculated_with_penalty():
    req = RefinancingRequest(
        current_outstanding=500_000,
        current_rate_pct=4.5,
        remaining_years=20,
        penalty_amount=5_000.0,
    )
    resp = calculate_refinancing(req)
    for o in resp.options:
        if o.monthly_savings > 0:
            assert o.break_even_months is not None
            assert o.break_even_months > 0
```

- [ ] **Step 2: Run tests to verify they fail**

```
cd backend && python -m pytest tests/test_loans_service.py -v
```

Expected: ImportError (modules don't exist yet)

- [ ] **Step 3: Create loan schemas**

```python
# backend/app/schemas/loans.py
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
```

- [ ] **Step 4: Create loan service**

```python
# backend/app/services/loans.py
from app.schemas.loans import (
    BankPackage,
    LoanComparisonRequest,
    LoanComparisonResponse,
    RefinancingOption,
    RefinancingRequest,
    RefinancingResponse,
)
from app.services.affordability import monthly_payment

_SORA_3M_PCT = 3.68
_TDSR_LIMIT = 0.55

# (bank, package_label, rate_type, spread_or_fixed_pct, lock_in_years)
_RAW_PACKAGES: list[tuple[str, str, str, float, int]] = [
    ("DBS", "DBS Fixed 2Y",        "fixed", 3.28, 2),
    ("DBS", "DBS SORA Float",      "sora",  0.85, 0),
    ("OCBC", "OCBC Fixed 2Y",      "fixed", 3.30, 2),
    ("OCBC", "OCBC SORA Float",    "sora",  0.88, 0),
    ("UOB", "UOB Fixed 2Y",        "fixed", 3.30, 2),
    ("UOB", "UOB SORA Float",      "sora",  0.90, 0),
    ("SCB", "SCB Fixed 2Y",        "fixed", 3.25, 2),
    ("SCB", "SCB SORA Float",      "sora",  0.80, 0),
    ("Citi", "Citi Fixed 2Y",      "fixed", 3.35, 2),
    ("Citi", "Citi SORA Float",    "sora",  0.95, 0),
    ("Maybank", "Maybank Fixed 2Y","fixed", 3.40, 2),
    ("Maybank", "Maybank SORA",    "sora",  0.98, 0),
    ("HSBC", "HSBC Fixed 2Y",      "fixed", 3.28, 2),
    ("HSBC", "HSBC SORA Float",    "sora",  0.88, 0),
    ("BOC", "BOC Fixed 2Y",        "fixed", 3.20, 2),
    ("BOC", "BOC SORA Float",      "sora",  0.92, 0),
    ("CIMB", "CIMB Fixed 2Y",      "fixed", 3.45, 2),
    ("CIMB", "CIMB SORA Float",    "sora",  1.00, 0),
    ("RHB", "RHB Fixed 2Y",        "fixed", 3.50, 2),
    ("RHB", "RHB SORA Float",      "sora",  1.05, 0),
]


def get_sora_rate() -> float:
    return _SORA_3M_PCT


def get_packages() -> list[tuple[str, str, str, float, int]]:
    return _RAW_PACKAGES


def compare_loans(req: LoanComparisonRequest) -> LoanComparisonResponse:
    sora = _SORA_3M_PCT
    packages: list[BankPackage] = []

    for bank, label, rate_type, spread_or_rate, lock_in in _RAW_PACKAGES:
        effective_rate = spread_or_rate if rate_type == "fixed" else sora + spread_or_rate
        effective_rate_dec = effective_rate / 100.0

        installment = monthly_payment(req.loan_amount, effective_rate_dec, req.tenure_years)
        n_months = req.tenure_years * 12
        total_interest = installment * n_months - req.loan_amount

        tdsr_pct: float | None = None
        tdsr_passes: bool | None = None
        if req.gross_monthly_income and req.gross_monthly_income > 0:
            total_commitments = installment + req.existing_monthly_commitments
            tdsr_pct = round(total_commitments / req.gross_monthly_income * 100, 1)
            tdsr_passes = total_commitments / req.gross_monthly_income <= _TDSR_LIMIT

        packages.append(
            BankPackage(
                bank=bank,
                package=label,
                rate_type=rate_type,
                effective_rate_pct=round(effective_rate, 2),
                monthly_installment=round(installment, 2),
                total_interest=round(total_interest, 2),
                lock_in_years=lock_in,
                tdsr_pct=tdsr_pct,
                tdsr_passes=tdsr_passes,
            )
        )

    packages.sort(key=lambda p: p.monthly_installment)
    return LoanComparisonResponse(sora_rate_pct=sora, packages=packages)


def _loan_balance(principal: float, annual_rate: float, tenure_years: int, elapsed_months: int) -> float:
    r = annual_rate / 12
    n = tenure_years * 12
    if r < 1e-10:
        return max(0.0, principal - (principal / n) * elapsed_months)
    payment = monthly_payment(principal, annual_rate, tenure_years)
    balance = principal * (1 + r) ** elapsed_months - payment * ((1 + r) ** elapsed_months - 1) / r
    return max(0.0, balance)


def calculate_refinancing(req: RefinancingRequest) -> RefinancingResponse:
    sora = _SORA_3M_PCT
    current_rate_dec = req.current_rate_pct / 100.0
    current_installment = monthly_payment(req.current_outstanding, current_rate_dec, req.remaining_years)
    n_months = req.remaining_years * 12
    current_total = current_installment * n_months

    options: list[RefinancingOption] = []

    for bank, label, rate_type, spread_or_rate, _ in _RAW_PACKAGES:
        effective_rate = spread_or_rate if rate_type == "fixed" else sora + spread_or_rate
        effective_rate_dec = effective_rate / 100.0

        new_installment = monthly_payment(req.current_outstanding, effective_rate_dec, req.remaining_years)
        monthly_savings = current_installment - new_installment
        new_total = new_installment * n_months
        total_savings = current_total - new_total - req.penalty_amount

        break_even: int | None = None
        if req.penalty_amount > 0 and monthly_savings > 0:
            break_even = int(req.penalty_amount / monthly_savings) + 1

        tdsr_pct: float | None = None
        tdsr_passes: bool | None = None
        if req.gross_monthly_income and req.gross_monthly_income > 0:
            total_commitments = new_installment + req.existing_monthly_commitments
            tdsr_pct = round(total_commitments / req.gross_monthly_income * 100, 1)
            tdsr_passes = total_commitments / req.gross_monthly_income <= _TDSR_LIMIT

        options.append(
            RefinancingOption(
                bank=bank,
                package=label,
                effective_rate_pct=round(effective_rate, 2),
                new_monthly_installment=round(new_installment, 2),
                monthly_savings=round(monthly_savings, 2),
                total_interest_savings=round(total_savings, 2),
                break_even_months=break_even,
                tdsr_pct=tdsr_pct,
                tdsr_passes=tdsr_passes,
            )
        )

    options.sort(key=lambda o: o.new_monthly_installment)
    return RefinancingResponse(
        current_monthly_installment=round(current_installment, 2),
        sora_rate_pct=sora,
        options=options,
    )
```

- [ ] **Step 5: Run tests to verify they pass**

```
cd backend && python -m pytest tests/test_loans_service.py -v
```

Expected: 8/8 PASS

- [ ] **Step 6: Commit**

```
git add backend/app/schemas/loans.py backend/app/services/loans.py backend/tests/test_loans_service.py
git commit -m "feat: loan comparison and refinancing service with 20 bank packages"
```

---

### Task 2: Loan Router + main.py

**Files:**
- Create: `backend/app/routers/loans.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_loans_router.py`

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_loans_router.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_compare_loans_200():
    resp = client.post("/api/loans/compare", json={
        "loan_amount": 800000,
        "tenure_years": 25,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "packages" in data
    assert len(data["packages"]) == 20
    assert "sora_rate_pct" in data


def test_compare_loans_with_income():
    resp = client.post("/api/loans/compare", json={
        "loan_amount": 500000,
        "tenure_years": 25,
        "gross_monthly_income": 12000,
        "existing_monthly_commitments": 500,
    })
    assert resp.status_code == 200
    data = resp.json()
    for pkg in data["packages"]:
        assert pkg["tdsr_pct"] is not None


def test_compare_loans_invalid_loan_amount():
    resp = client.post("/api/loans/compare", json={"loan_amount": 0})
    assert resp.status_code == 422


def test_refinance_200():
    resp = client.post("/api/loans/refinance", json={
        "current_outstanding": 500000,
        "current_rate_pct": 4.5,
        "remaining_years": 20,
        "penalty_amount": 0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "options" in data
    assert len(data["options"]) == 20
    assert "current_monthly_installment" in data


def test_refinance_invalid_rate():
    resp = client.post("/api/loans/refinance", json={
        "current_outstanding": 500000,
        "current_rate_pct": 25.0,
        "remaining_years": 20,
    })
    assert resp.status_code == 422
```

- [ ] **Step 2: Run tests to verify they fail**

```
cd backend && python -m pytest tests/test_loans_router.py -v
```

Expected: 404 or ImportError (router not registered yet)

- [ ] **Step 3: Create the loan router**

```python
# backend/app/routers/loans.py
from fastapi import APIRouter
from app.schemas.loans import LoanComparisonRequest, LoanComparisonResponse, RefinancingRequest, RefinancingResponse
from app.services.loans import compare_loans, calculate_refinancing

router = APIRouter(prefix="/api/loans", tags=["loans"])


@router.post("/compare", response_model=LoanComparisonResponse)
def loan_compare(req: LoanComparisonRequest) -> LoanComparisonResponse:
    return compare_loans(req)


@router.post("/refinance", response_model=RefinancingResponse)
def loan_refinance(req: RefinancingRequest) -> RefinancingResponse:
    return calculate_refinancing(req)
```

- [ ] **Step 4: Register router in main.py**

In `backend/app/main.py`, add after the existing router imports:

```python
from app.routers import tax, profile, market, transactions, loans
```

And after the existing `app.include_router(transactions.router)` line:

```python
app.include_router(loans.router)
```

- [ ] **Step 5: Run tests to verify they pass**

```
cd backend && python -m pytest tests/test_loans_router.py -v
```

Expected: 5/5 PASS

- [ ] **Step 6: Run full backend test suite**

```
cd backend && python -m pytest -v
```

Expected: All previously passing tests still pass, plus 5 new.

- [ ] **Step 7: Commit**

```
git add backend/app/routers/loans.py backend/app/main.py backend/tests/test_loans_router.py
git commit -m "feat: loan comparison and refinancing API endpoints"
```

---

### Task 3: ROI Schemas + Service

**Files:**
- Create: `backend/app/schemas/roi.py`
- Create: `backend/app/services/roi.py`
- Create: `backend/tests/test_roi_service.py`

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_roi_service.py
import pytest
from app.services.roi import calculate_roi, _irr
from app.schemas.roi import ROIRequest


def test_irr_positive_investment():
    # Simple 10% annualized return over 5 years
    # Initial outlay 100k, 5 equal cashflows of ~26.38k should give ~10% IRR
    cashflows = [-100_000] + [26_380] * 5
    irr = _irr(cashflows)
    assert irr == pytest.approx(10.0, abs=0.5)


def test_irr_negative_returns_negative():
    # Losing investment
    cashflows = [-100_000, 20_000, 20_000, 20_000, 20_000, 20_000]
    irr = _irr(cashflows)
    assert irr < 0


def test_calculate_roi_basic():
    req = ROIRequest(
        purchase_price=1_000_000,
        loan_amount=750_000,
        annual_rate_pct=3.5,
        tenure_years=25,
        hold_years=5,
        monthly_rental_sgd=3_000,
        annual_appreciation_pct=3.0,
        annual_expenses_pct=1.0,
    )
    resp = calculate_roi(req)
    assert resp.down_payment == pytest.approx(250_000)
    assert len(resp.yearly) == 5
    assert resp.yearly[0].year == 1
    assert resp.yearly[4].year == 5
    assert resp.exit_value > 1_000_000
    assert resp.total_rental_income > 0
    assert len(resp.scenarios) == 3


def test_calculate_roi_scenario_labels():
    req = ROIRequest(
        purchase_price=1_000_000,
        loan_amount=0,
        annual_rate_pct=3.5,
        tenure_years=25,
        hold_years=3,
        monthly_rental_sgd=0,
        annual_appreciation_pct=3.0,
        annual_expenses_pct=0.5,
    )
    resp = calculate_roi(req)
    labels = [s.label for s in resp.scenarios]
    assert "Bear" in labels
    assert "Base" in labels
    assert "Bull" in labels


def test_calculate_roi_bull_beats_bear():
    req = ROIRequest(
        purchase_price=1_000_000,
        loan_amount=750_000,
        annual_rate_pct=3.5,
        tenure_years=25,
        hold_years=5,
        monthly_rental_sgd=3_000,
        annual_appreciation_pct=3.0,
        annual_expenses_pct=1.0,
    )
    resp = calculate_roi(req)
    bear = next(s for s in resp.scenarios if s.label == "Bear")
    bull = next(s for s in resp.scenarios if s.label == "Bull")
    assert bull.net_gain > bear.net_gain
    assert bull.irr_pct > bear.irr_pct


def test_calculate_roi_cumulative_cashflow_increases_with_rental():
    req = ROIRequest(
        purchase_price=1_000_000,
        loan_amount=0,
        annual_rate_pct=3.5,
        tenure_years=25,
        hold_years=5,
        monthly_rental_sgd=4_000,
        annual_appreciation_pct=0.0,
        annual_expenses_pct=0.0,
    )
    resp = calculate_roi(req)
    for i in range(1, len(resp.yearly)):
        assert resp.yearly[i].cumulative_cashflow > resp.yearly[i - 1].cumulative_cashflow
```

- [ ] **Step 2: Run tests to verify they fail**

```
cd backend && python -m pytest tests/test_roi_service.py -v
```

Expected: ImportError (modules don't exist yet)

- [ ] **Step 3: Create ROI schemas**

```python
# backend/app/schemas/roi.py
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
```

- [ ] **Step 4: Create ROI service**

```python
# backend/app/services/roi.py
from app.schemas.roi import ROIRequest, ROIResponse, YearlyResult, ScenarioResult
from app.services.affordability import monthly_payment


def _loan_balance(principal: float, annual_rate: float, tenure_years: int, elapsed_months: int) -> float:
    r = annual_rate / 12
    n = tenure_years * 12
    if r < 1e-10:
        return max(0.0, principal - (principal / n) * elapsed_months)
    payment = monthly_payment(principal, annual_rate, tenure_years)
    balance = principal * (1 + r) ** elapsed_months - payment * ((1 + r) ** elapsed_months - 1) / r
    return max(0.0, balance)


def _npv(cashflows: list[float], rate: float) -> float:
    return sum(cf / (1 + rate) ** t for t, cf in enumerate(cashflows))


def _irr(cashflows: list[float]) -> float:
    """IRR as annualised %, via bisection on NPV=0. Returns 0.0 if no solution found."""
    lo, hi = -0.5, 10.0
    if _npv(cashflows, lo) * _npv(cashflows, hi) > 0:
        return 0.0
    for _ in range(200):
        mid = (lo + hi) / 2
        if _npv(cashflows, mid) > 0:
            lo = mid
        else:
            hi = mid
    return round(mid * 100, 2)


def _compute_roi(req: ROIRequest, appreciation_pct: float, rental_multiplier: float) -> ROIResponse:
    down_payment = req.purchase_price - req.loan_amount
    annual_rate_dec = req.annual_rate_pct / 100.0
    monthly_installment = (
        monthly_payment(req.loan_amount, annual_rate_dec, req.tenure_years)
        if req.loan_amount > 0
        else 0.0
    )
    annual_mortgage = monthly_installment * 12

    # Initial cashflow = -down_payment (money out at t=0)
    cashflows: list[float] = [-down_payment]
    yearly: list[YearlyResult] = []
    cumulative = 0.0
    total_rental = 0.0
    total_mortgage = 0.0
    total_expenses = 0.0

    for yr in range(1, req.hold_years + 1):
        property_value = req.purchase_price * (1 + appreciation_pct / 100) ** yr
        rental_income = req.monthly_rental_sgd * rental_multiplier * 12
        expenses = property_value * req.annual_expenses_pct / 100
        net_cashflow = rental_income - annual_mortgage - expenses
        cumulative += net_cashflow
        loan_bal = _loan_balance(req.loan_amount, annual_rate_dec, req.tenure_years, yr * 12)

        total_rental += rental_income
        total_mortgage += annual_mortgage
        total_expenses += expenses
        cashflows.append(net_cashflow)

        yearly.append(
            YearlyResult(
                year=yr,
                property_value=round(property_value, 2),
                rental_income=round(rental_income, 2),
                mortgage_payment=round(annual_mortgage, 2),
                annual_expenses=round(expenses, 2),
                net_cashflow=round(net_cashflow, 2),
                cumulative_cashflow=round(cumulative, 2),
                loan_balance=round(loan_bal, 2),
            )
        )

    exit_value = req.purchase_price * (1 + appreciation_pct / 100) ** req.hold_years
    final_loan_balance = _loan_balance(req.loan_amount, annual_rate_dec, req.tenure_years, req.hold_years * 12)
    net_proceeds = exit_value - final_loan_balance

    # Final cashflow: net proceeds from sale
    cashflows[-1] += net_proceeds
    net_gain = net_proceeds - down_payment + total_rental - total_mortgage - total_expenses
    total_return_pct = net_gain / down_payment * 100 if down_payment > 0 else 0.0
    irr_pct = _irr(cashflows)

    return ROIResponse(
        down_payment=round(down_payment, 2),
        yearly=yearly,
        exit_value=round(exit_value, 2),
        total_rental_income=round(total_rental, 2),
        total_mortgage_paid=round(total_mortgage, 2),
        total_expenses=round(total_expenses, 2),
        net_gain=round(net_gain, 2),
        total_return_pct=round(total_return_pct, 2),
        irr_pct=irr_pct,
        scenarios=[],
    )


def calculate_roi(req: ROIRequest) -> ROIResponse:
    base = _compute_roi(req, req.annual_appreciation_pct, 1.0)
    bear = _compute_roi(req, req.annual_appreciation_pct - 2.0, 0.9)
    bull = _compute_roi(req, req.annual_appreciation_pct + 2.0, 1.1)

    scenarios = [
        ScenarioResult(label="Bear", total_return_pct=bear.total_return_pct, irr_pct=bear.irr_pct, net_gain=bear.net_gain, exit_value=bear.exit_value),
        ScenarioResult(label="Base", total_return_pct=base.total_return_pct, irr_pct=base.irr_pct, net_gain=base.net_gain, exit_value=base.exit_value),
        ScenarioResult(label="Bull", total_return_pct=bull.total_return_pct, irr_pct=bull.irr_pct, net_gain=bull.net_gain, exit_value=bull.exit_value),
    ]

    base.scenarios = scenarios
    return base
```

- [ ] **Step 5: Run tests to verify they pass**

```
cd backend && python -m pytest tests/test_roi_service.py -v
```

Expected: 6/6 PASS

- [ ] **Step 6: Commit**

```
git add backend/app/schemas/roi.py backend/app/services/roi.py backend/tests/test_roi_service.py
git commit -m "feat: ROI projector service with IRR calculation and Bear/Base/Bull scenarios"
```

---

### Task 4: ROI Router + main.py

**Files:**
- Create: `backend/app/routers/roi.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_roi_router.py`

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_roi_router.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_roi_calculate_200():
    resp = client.post("/api/roi/calculate", json={
        "purchase_price": 1_000_000,
        "loan_amount": 750_000,
        "annual_rate_pct": 3.5,
        "tenure_years": 25,
        "hold_years": 5,
        "monthly_rental_sgd": 3000,
        "annual_appreciation_pct": 3.0,
        "annual_expenses_pct": 1.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "yearly" in data
    assert len(data["yearly"]) == 5
    assert "scenarios" in data
    assert len(data["scenarios"]) == 3


def test_roi_calculate_default_fields():
    resp = client.post("/api/roi/calculate", json={
        "purchase_price": 800_000,
        "loan_amount": 600_000,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["down_payment"] == pytest.approx(200_000)


def test_roi_calculate_invalid_price():
    resp = client.post("/api/roi/calculate", json={
        "purchase_price": 0,
        "loan_amount": 0,
    })
    assert resp.status_code == 422


def test_roi_calculate_irr_present():
    resp = client.post("/api/roi/calculate", json={
        "purchase_price": 1_000_000,
        "loan_amount": 750_000,
        "hold_years": 5,
        "monthly_rental_sgd": 3000,
        "annual_appreciation_pct": 3.0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "irr_pct" in data
    assert isinstance(data["irr_pct"], float)
```

- [ ] **Step 2: Run tests to verify they fail**

```
cd backend && python -m pytest tests/test_roi_router.py -v
```

Expected: 404 (router not registered)

- [ ] **Step 3: Create the ROI router**

```python
# backend/app/routers/roi.py
from fastapi import APIRouter
from app.schemas.roi import ROIRequest, ROIResponse
from app.services.roi import calculate_roi

router = APIRouter(prefix="/api/roi", tags=["roi"])


@router.post("/calculate", response_model=ROIResponse)
def roi_calculate(req: ROIRequest) -> ROIResponse:
    return calculate_roi(req)
```

- [ ] **Step 4: Register router in main.py**

In `backend/app/main.py`, update the router imports line to:

```python
from app.routers import tax, profile, market, transactions, loans, roi
```

And add after `app.include_router(loans.router)`:

```python
app.include_router(roi.router)
```

- [ ] **Step 5: Run tests to verify they pass**

```
cd backend && python -m pytest tests/test_roi_router.py -v
```

Expected: 4/4 PASS

- [ ] **Step 6: Run full backend test suite**

```
cd backend && python -m pytest -v
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```
git add backend/app/routers/roi.py backend/app/main.py backend/tests/test_roi_router.py
git commit -m "feat: ROI projector API endpoint"
```

---

### Task 5: Frontend Loan Comparison Page

**Files:**
- Create: `frontend/src/api/loans.ts`
- Create: `frontend/src/pages/LoanPage.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create the loans API module**

```typescript
// frontend/src/api/loans.ts
import { apiPost } from './client'

export interface BankPackage {
  bank: string
  package: string
  rate_type: string
  effective_rate_pct: number
  monthly_installment: number
  total_interest: number
  lock_in_years: number
  tdsr_pct: number | null
  tdsr_passes: boolean | null
}

export interface LoanComparisonRequest {
  loan_amount: number
  tenure_years: number
  gross_monthly_income?: number
  existing_monthly_commitments?: number
}

export interface LoanComparisonResponse {
  sora_rate_pct: number
  packages: BankPackage[]
}

export interface RefinancingOption {
  bank: string
  package: string
  effective_rate_pct: number
  new_monthly_installment: number
  monthly_savings: number
  total_interest_savings: number
  break_even_months: number | null
  tdsr_pct: number | null
  tdsr_passes: boolean | null
}

export interface RefinancingRequest {
  current_outstanding: number
  current_rate_pct: number
  remaining_years: number
  penalty_amount?: number
  gross_monthly_income?: number
  existing_monthly_commitments?: number
}

export interface RefinancingResponse {
  current_monthly_installment: number
  sora_rate_pct: number
  options: RefinancingOption[]
}

export function compareLoans(req: LoanComparisonRequest): Promise<LoanComparisonResponse> {
  return apiPost('/api/loans/compare', req)
}

export function refinanceLoans(req: RefinancingRequest): Promise<RefinancingResponse> {
  return apiPost('/api/loans/refinance', req)
}
```

- [ ] **Step 2: Create the LoanPage component**

```tsx
// frontend/src/pages/LoanPage.tsx
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
```

- [ ] **Step 3: Wire up route in App.tsx**

In `frontend/src/App.tsx`, add the import:

```tsx
import { LoanPage } from './pages/LoanPage'
```

Replace:

```tsx
{ path: '/loans', element: <ComingSoon name="Loan Comparison" /> }
```

With:

```tsx
{ path: '/loans', element: <LoanPage /> }
```

- [ ] **Step 4: TypeScript check**

```
cd frontend && npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 5: Commit**

```
git add frontend/src/api/loans.ts frontend/src/pages/LoanPage.tsx frontend/src/App.tsx
git commit -m "feat: loan comparison and refinancing frontend page"
```

---

### Task 6: Frontend ROI Projector Page

**Files:**
- Create: `frontend/src/api/roi.ts`
- Create: `frontend/src/pages/ROIPage.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create the ROI API module**

```typescript
// frontend/src/api/roi.ts
import { apiPost } from './client'

export interface ROIRequest {
  purchase_price: number
  loan_amount: number
  annual_rate_pct?: number
  tenure_years?: number
  hold_years?: number
  monthly_rental_sgd?: number
  annual_appreciation_pct?: number
  annual_expenses_pct?: number
}

export interface YearlyResult {
  year: number
  property_value: number
  rental_income: number
  mortgage_payment: number
  annual_expenses: number
  net_cashflow: number
  cumulative_cashflow: number
  loan_balance: number
}

export interface ScenarioResult {
  label: string
  total_return_pct: number
  irr_pct: number
  net_gain: number
  exit_value: number
}

export interface ROIResponse {
  down_payment: number
  yearly: YearlyResult[]
  exit_value: number
  total_rental_income: number
  total_mortgage_paid: number
  total_expenses: number
  net_gain: number
  total_return_pct: number
  irr_pct: number
  scenarios: ScenarioResult[]
}

export function calculateROI(req: ROIRequest): Promise<ROIResponse> {
  return apiPost('/api/roi/calculate', req)
}
```

- [ ] **Step 2: Create the ROIPage component**

```tsx
// frontend/src/pages/ROIPage.tsx
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
                <Tooltip formatter={(v: number) => formatSgd(v)} contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 6 }} labelStyle={{ color: '#e5e7eb' }} />
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
```

- [ ] **Step 3: Wire up route in App.tsx**

In `frontend/src/App.tsx`, add the import:

```tsx
import { ROIPage } from './pages/ROIPage'
```

Replace:

```tsx
{ path: '/roi', element: <ComingSoon name="ROI Projector" /> }
```

With:

```tsx
{ path: '/roi', element: <ROIPage /> }
```

- [ ] **Step 4: TypeScript check**

```
cd frontend && npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 5: Commit**

```
git add frontend/src/api/roi.ts frontend/src/pages/ROIPage.tsx frontend/src/App.tsx
git commit -m "feat: ROI projector frontend page with IRR chart and scenario sensitivity"
```
