# PropSage Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the full monorepo, implement the regulatory/tax engine backend (BSD/ABSD/SSD/upfront cost, TDSR/MSR/LTV), and build the investor profile form and tax calculator UI.

**Architecture:** Python FastAPI backend with pure-function tax services, React + Vite + TypeScript frontend with Zustand for localStorage-persisted investor profile. No external APIs or database in Phase 1 — all calculations are pure functions.

**Tech Stack:** Python 3.11+, FastAPI 0.115, Pydantic v2, pytest, React 18, TypeScript, Vite, Tailwind CSS 3, Zustand 4, React Router 6

---

## File Map

### Backend
| File | Purpose |
|---|---|
| `backend/app/main.py` | FastAPI app, CORS config, router registration |
| `backend/app/routers/tax.py` | POST /api/tax/upfront-cost, POST /api/tax/ssd |
| `backend/app/routers/profile.py` | POST /api/profile/affordability |
| `backend/app/services/tax.py` | BSD, ABSD, SSD, upfront cost — pure functions |
| `backend/app/services/affordability.py` | TDSR, MSR, LTV, max loan — pure functions |
| `backend/app/schemas/tax.py` | Pydantic request/response models for tax |
| `backend/app/schemas/profile.py` | Pydantic request/response models for affordability |
| `backend/requirements.txt` | Python dependencies |
| `backend/.env` | Local secrets (gitignored) |
| `backend/tests/conftest.py` | pytest TestClient fixture |
| `backend/tests/test_tax.py` | Unit tests for tax service |
| `backend/tests/test_affordability.py` | Unit tests for affordability service |
| `backend/tests/test_routers.py` | Integration tests for API endpoints |

### Frontend
| File | Purpose |
|---|---|
| `frontend/index.html` | HTML entry point |
| `frontend/package.json` | npm dependencies |
| `frontend/vite.config.ts` | Vite + React plugin config |
| `frontend/tailwind.config.js` | Tailwind content paths |
| `frontend/postcss.config.js` | PostCSS with Tailwind + autoprefixer |
| `frontend/tsconfig.json` | TypeScript config |
| `frontend/src/main.tsx` | React DOM entry |
| `frontend/src/index.css` | Tailwind directives |
| `frontend/src/App.tsx` | BrowserRouter + Routes |
| `frontend/src/components/layout/AppShell.tsx` | Sidebar + main content wrapper |
| `frontend/src/components/layout/Sidebar.tsx` | Nav links with active state |
| `frontend/src/stores/profileStore.ts` | Zustand store, persisted to localStorage |
| `frontend/src/api/client.ts` | apiGet / apiPost fetch wrappers |
| `frontend/src/api/tax.ts` | calculateUpfrontCost, calculateSsd |
| `frontend/src/api/profile.ts` | checkAffordability |
| `frontend/src/types/profile.ts` | Citizenship, InvestorProfile, etc. |
| `frontend/src/pages/ProfilePage.tsx` | Investor profile form |
| `frontend/src/pages/CalculatorPage.tsx` | Tax & cost calculator UI |

### Root
| File | Purpose |
|---|---|
| `.env.example` | Template for all API keys |
| `.gitignore` | Excludes .env, __pycache__, node_modules, etc. |

---

## Task 1: Root Config Files

**Files:**
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Create `.env.example`**

```
# Data source toggle
USE_MOCK_DATA=true

# URA Data Service (granular per-unit transactions — Phase 2)
URA_ACCESS_KEY=your_ura_access_key_here

# AI Advisory engine (Phase 5)
GEMINI_API_KEY=your_gemini_api_key_here

# OneMap Singapore (maps — Phase 4)
ONEMAP_TOKEN=your_onemap_token_here

# App
CORS_ORIGINS=http://localhost:5173
```

- [ ] **Step 2: Create `.gitignore`**

```
# Python
__pycache__/
*.py[cod]
*.egg-info/
.venv/
venv/
backend/.env

# Node
node_modules/
frontend/dist/
frontend/.env

# DB
*.db
*.sqlite

# IDE
.vscode/
.idea/

# Superpowers
.superpowers/
```

- [ ] **Step 3: Commit**

```bash
git init
git add .env.example .gitignore
git commit -m "chore: root config files and gitignore"
```

---

## Task 2: Backend Scaffold

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/routers/__init__.py`
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/schemas/__init__.py`
- Create: `backend/tests/__init__.py`

- [ ] **Step 1: Create `backend/requirements.txt`**

```
fastapi==0.115.0
uvicorn[standard]==0.30.6
python-dotenv==1.0.1
pydantic==2.8.2
sqlalchemy==2.0.35
pytest==8.3.3
httpx==0.27.2
pytest-asyncio==0.24.0
```

- [ ] **Step 2: Create all `__init__.py` files (all empty)**

```bash
mkdir -p backend/app/routers backend/app/services backend/app/schemas backend/tests
touch backend/app/__init__.py backend/app/routers/__init__.py backend/app/services/__init__.py backend/app/schemas/__init__.py backend/tests/__init__.py
```

- [ ] **Step 3: Install dependencies**

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

Expected: packages install without errors.

- [ ] **Step 4: Commit**

```bash
git add backend/
git commit -m "chore: backend python scaffold and dependencies"
```

---

## Task 3: Tax Service — Pure Functions

**Files:**
- Create: `backend/app/services/tax.py`
- Create: `backend/tests/test_tax.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_tax.py`:

```python
import pytest
from app.services.tax import (
    calculate_bsd,
    calculate_absd,
    calculate_ssd,
    calculate_upfront_cost,
)


class TestCalculateBsd:
    def test_first_bracket_only(self):
        # $100K → 1% of 100K = 1,000
        assert calculate_bsd(100_000) == 1_000.0

    def test_two_brackets(self):
        # 1% × 180K = 1,800 + 2% × 100K = 2,000 → 3,800
        assert calculate_bsd(280_000) == 3_800.0

    def test_three_brackets_at_1m(self):
        # 1% × 180K = 1,800 + 2% × 180K = 3,600 + 3% × 640K = 19,200 → 24,600
        assert calculate_bsd(1_000_000) == 24_600.0

    def test_fourth_bracket(self):
        # 24,600 + 4% × 500K = 20,000 → 44,600
        assert calculate_bsd(1_500_000) == 44_600.0


class TestCalculateAbsd:
    def test_sc_first_property_zero(self):
        assert calculate_absd(1_000_000, "SC", 0) == 0.0

    def test_sc_second_property_20pct(self):
        assert calculate_absd(1_000_000, "SC", 1) == 200_000.0

    def test_sc_third_property_30pct(self):
        assert calculate_absd(1_000_000, "SC", 2) == 300_000.0

    def test_pr_first_property_5pct(self):
        assert calculate_absd(1_000_000, "PR", 0) == 50_000.0

    def test_pr_second_property_30pct(self):
        assert calculate_absd(1_000_000, "PR", 1) == 300_000.0

    def test_foreigner_always_60pct(self):
        assert calculate_absd(1_000_000, "Foreigner", 0) == 600_000.0
        assert calculate_absd(1_000_000, "Foreigner", 1) == 600_000.0

    def test_entity_always_65pct(self):
        assert calculate_absd(1_000_000, "Entity", 0) == 650_000.0

    def test_unknown_citizenship_falls_back_to_entity_rate(self):
        assert calculate_absd(1_000_000, "Unknown", 0) == 650_000.0


class TestCalculateSsd:
    def test_within_one_year_12pct(self):
        assert calculate_ssd(1_000_000, 0.5) == 120_000.0

    def test_one_to_two_years_8pct(self):
        assert calculate_ssd(1_000_000, 1.5) == 80_000.0

    def test_two_to_three_years_4pct(self):
        assert calculate_ssd(1_000_000, 2.5) == 40_000.0

    def test_exactly_three_years_4pct(self):
        assert calculate_ssd(1_000_000, 3.0) == 40_000.0

    def test_beyond_three_years_zero(self):
        assert calculate_ssd(1_000_000, 5.0) == 0.0


class TestCalculateUpfrontCost:
    def test_sc_first_property_full_breakdown(self):
        result = calculate_upfront_cost(1_000_000, "SC", 0)
        assert result["purchase_price"] == 1_000_000
        assert result["bsd"] == 24_600.0
        assert result["absd"] == 0.0
        assert result["legal_fees"] == 3_000.0
        assert result["agent_commission"] == 10_000.0  # 1% of 1M
        assert result["valuation_fee"] == 500.0
        assert result["renovation_budget"] == 0.0
        assert result["total_cash_outlay"] == 1_038_100.0

    def test_renovation_budget_included_in_total(self):
        result = calculate_upfront_cost(1_000_000, "SC", 0, renovation_budget=50_000)
        assert result["renovation_budget"] == 50_000.0
        assert result["total_cash_outlay"] == 1_088_100.0

    def test_foreigner_high_absd_in_total(self):
        result = calculate_upfront_cost(1_000_000, "Foreigner", 0)
        assert result["absd"] == 600_000.0
        assert result["total_cash_outlay"] > 1_600_000
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd backend
pytest tests/test_tax.py -v
```

Expected: `ImportError` — `app.services.tax` does not exist yet.

- [ ] **Step 3: Implement `backend/app/services/tax.py`**

```python
_ABSD_RATES: dict[tuple[str, int], float] = {
    ("SC", 1): 0.00,
    ("SC", 2): 0.20,
    ("SC", 3): 0.30,
    ("PR", 1): 0.05,
    ("PR", 2): 0.30,
    ("PR", 3): 0.35,
    ("Foreigner", 1): 0.60,
    ("Foreigner", 2): 0.60,
    ("Foreigner", 3): 0.60,
    ("Entity", 1): 0.65,
    ("Entity", 2): 0.65,
    ("Entity", 3): 0.65,
}

_BSD_BRACKETS = [
    (180_000, 0.01),
    (180_000, 0.02),
    (640_000, 0.03),
]


def calculate_bsd(price: float) -> float:
    """Buyer's Stamp Duty on tiered purchase price brackets."""
    bsd = 0.0
    remaining = price
    for cap, rate in _BSD_BRACKETS:
        chunk = min(remaining, cap)
        bsd += chunk * rate
        remaining -= chunk
        if remaining <= 0:
            break
    if remaining > 0:
        bsd += remaining * 0.04
    return round(bsd, 2)


def calculate_absd(price: float, citizenship: str, existing_property_count: int) -> float:
    """Additional Buyer's Stamp Duty. existing_property_count is count BEFORE this purchase."""
    purchase_number = min(existing_property_count + 1, 3)
    rate = _ABSD_RATES.get((citizenship, purchase_number), 0.65)
    return round(price * rate, 2)


def calculate_ssd(price: float, hold_years: float) -> float:
    """Seller's Stamp Duty if sold within 3 years of purchase."""
    if hold_years <= 1:
        rate = 0.12
    elif hold_years <= 2:
        rate = 0.08
    elif hold_years <= 3:
        rate = 0.04
    else:
        rate = 0.0
    return round(price * rate, 2)


def calculate_upfront_cost(
    price: float,
    citizenship: str,
    property_count: int,
    renovation_budget: float = 0.0,
    agent_rate: float = 0.01,
) -> dict:
    bsd = calculate_bsd(price)
    absd = calculate_absd(price, citizenship, property_count)
    legal_fees = 3_000.0
    agent_commission = round(price * agent_rate, 2)
    valuation_fee = 500.0
    total = price + bsd + absd + legal_fees + agent_commission + valuation_fee + renovation_budget
    return {
        "purchase_price": price,
        "bsd": bsd,
        "absd": absd,
        "legal_fees": legal_fees,
        "agent_commission": agent_commission,
        "valuation_fee": valuation_fee,
        "renovation_budget": renovation_budget,
        "total_cash_outlay": round(total, 2),
    }
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
pytest tests/test_tax.py -v
```

Expected: all 16 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/tax.py backend/tests/test_tax.py
git commit -m "feat: tax service — BSD, ABSD, SSD, upfront cost with tests"
```

---

## Task 4: Affordability Service — Pure Functions

**Files:**
- Create: `backend/app/services/affordability.py`
- Create: `backend/tests/test_affordability.py`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/test_affordability.py`:

```python
from app.services.affordability import (
    calculate_tdsr,
    calculate_msr,
    calculate_ltv,
    calculate_max_loan,
)


class TestCalculateTdsr:
    def test_passes_under_55pct(self):
        result = calculate_tdsr(10_000, 3_000)
        assert result["tdsr_pct"] == 30.0
        assert result["passes"] is True

    def test_fails_over_55pct(self):
        result = calculate_tdsr(10_000, 6_000)
        assert result["tdsr_pct"] == 60.0
        assert result["passes"] is False

    def test_exactly_55pct_passes(self):
        result = calculate_tdsr(10_000, 5_500)
        assert result["passes"] is True

    def test_existing_commitments_add_to_total_debt(self):
        result = calculate_tdsr(10_000, 3_000, existing_monthly_commitments=3_000)
        assert result["tdsr_pct"] == 60.0
        assert result["passes"] is False

    def test_monthly_debt_cap_is_55pct_of_income(self):
        result = calculate_tdsr(10_000, 0)
        assert result["monthly_debt_cap"] == 5_500.0


class TestCalculateMsr:
    def test_passes_under_30pct(self):
        result = calculate_msr(10_000, 2_000)
        assert result["msr_pct"] == 20.0
        assert result["passes"] is True

    def test_fails_over_30pct(self):
        result = calculate_msr(10_000, 4_000)
        assert result["msr_pct"] == 40.0
        assert result["passes"] is False

    def test_payment_cap_is_30pct_of_income(self):
        result = calculate_msr(10_000, 0)
        assert result["monthly_payment_cap"] == 3_000.0


class TestCalculateLtv:
    def test_first_loan_75pct(self):
        assert calculate_ltv(0)["max_ltv"] == 0.75

    def test_second_loan_45pct(self):
        assert calculate_ltv(1)["max_ltv"] == 0.45

    def test_third_loan_35pct(self):
        assert calculate_ltv(2)["max_ltv"] == 0.35

    def test_beyond_third_also_35pct(self):
        assert calculate_ltv(5)["max_ltv"] == 0.35


class TestCalculateMaxLoan:
    def test_ltv_cap_applied_for_high_income(self):
        result = calculate_max_loan(
            price=1_000_000,
            gross_monthly_income=50_000,
            loan_count=0,
            loan_tenure_years=30,
        )
        assert result["max_loan"] <= 750_000
        assert result["is_feasible"] is True

    def test_min_cash_always_5pct_of_price(self):
        result = calculate_max_loan(
            price=1_000_000,
            gross_monthly_income=20_000,
            loan_count=0,
            loan_tenure_years=30,
        )
        assert result["min_cash_portion"] == 50_000.0

    def test_tdsr_reduces_max_loan_when_income_low(self):
        high_income_result = calculate_max_loan(
            price=2_000_000, gross_monthly_income=50_000, loan_count=0, loan_tenure_years=30
        )
        low_income_result = calculate_max_loan(
            price=2_000_000, gross_monthly_income=5_000, loan_count=0, loan_tenure_years=30
        )
        assert low_income_result["max_loan"] < high_income_result["max_loan"]

    def test_hdb_msr_further_constrains_loan(self):
        condo_result = calculate_max_loan(
            price=800_000, gross_monthly_income=8_000, loan_count=0,
            loan_tenure_years=30, is_hdb=False,
        )
        hdb_result = calculate_max_loan(
            price=800_000, gross_monthly_income=8_000, loan_count=0,
            loan_tenure_years=30, is_hdb=True,
        )
        assert hdb_result["max_loan"] <= condo_result["max_loan"]
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
pytest tests/test_affordability.py -v
```

Expected: `ImportError` — module not found.

- [ ] **Step 3: Implement `backend/app/services/affordability.py`**

```python
def calculate_tdsr(
    gross_monthly_income: float,
    monthly_loan_payment: float,
    existing_monthly_commitments: float = 0.0,
) -> dict:
    """Total Debt Servicing Ratio — must not exceed 55%."""
    total_debt = monthly_loan_payment + existing_monthly_commitments
    ratio = total_debt / gross_monthly_income if gross_monthly_income > 0 else 1.0
    return {
        "tdsr_ratio": round(ratio, 4),
        "tdsr_pct": round(ratio * 100, 2),
        "passes": ratio <= 0.55,
        "monthly_debt_cap": round(gross_monthly_income * 0.55, 2),
    }


def calculate_msr(
    gross_monthly_income: float,
    monthly_loan_payment: float,
) -> dict:
    """Mortgage Servicing Ratio — max 30%, applies to HDB and EC only."""
    ratio = monthly_loan_payment / gross_monthly_income if gross_monthly_income > 0 else 1.0
    return {
        "msr_ratio": round(ratio, 4),
        "msr_pct": round(ratio * 100, 2),
        "passes": ratio <= 0.30,
        "monthly_payment_cap": round(gross_monthly_income * 0.30, 2),
    }


def calculate_ltv(loan_count: int) -> dict:
    """Loan-to-Value limit based on number of existing outstanding loans."""
    _ltv_map = {0: 0.75, 1: 0.45}
    max_ltv = _ltv_map.get(loan_count, 0.35)
    return {"max_ltv": max_ltv, "max_ltv_pct": max_ltv * 100, "loan_count": loan_count}


def _monthly_payment(principal: float, annual_rate: float, tenure_years: int) -> float:
    r = annual_rate / 12
    n = tenure_years * 12
    if r == 0:
        return principal / n
    return principal * (r * (1 + r) ** n) / ((1 + r) ** n - 1)


def _max_loan_from_payment(monthly_cap: float, annual_rate: float, tenure_years: int) -> float:
    r = annual_rate / 12
    n = tenure_years * 12
    if r == 0:
        return monthly_cap * n
    return monthly_cap * ((1 + r) ** n - 1) / (r * (1 + r) ** n)


def calculate_max_loan(
    price: float,
    gross_monthly_income: float,
    loan_count: int,
    loan_tenure_years: int,
    existing_monthly_commitments: float = 0.0,
    is_hdb: bool = False,
    stress_rate: float = 0.04,
) -> dict:
    """Maximum eligible loan bounded by LTV and TDSR (+ MSR for HDB/EC)."""
    ltv = calculate_ltv(loan_count)
    ltv_cap = price * ltv["max_ltv"]

    tdsr_payment_cap = gross_monthly_income * 0.55 - existing_monthly_commitments
    msr_payment_cap = gross_monthly_income * 0.30 if is_hdb else float("inf")
    debt_service_cap = min(tdsr_payment_cap, msr_payment_cap)

    max_loan_from_debt = _max_loan_from_payment(debt_service_cap, stress_rate, loan_tenure_years)
    max_loan = max(0.0, min(ltv_cap, max_loan_from_debt))
    min_down = price - max_loan

    return {
        "max_loan": round(max_loan, 2),
        "min_down_payment": round(min_down, 2),
        "min_cash_portion": round(price * 0.05, 2),
        "ltv_limit": ltv["max_ltv_pct"],
        "is_feasible": max_loan > 0 and min_down >= 0,
    }
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
pytest tests/test_affordability.py -v
```

Expected: all 14 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/affordability.py backend/tests/test_affordability.py
git commit -m "feat: affordability service — TDSR, MSR, LTV, max loan with tests"
```

---

## Task 5: Pydantic Schemas

**Files:**
- Create: `backend/app/schemas/tax.py`
- Create: `backend/app/schemas/profile.py`

- [ ] **Step 1: Create `backend/app/schemas/tax.py`**

```python
from pydantic import BaseModel


class TaxRequest(BaseModel):
    purchase_price: float
    citizenship: str  # SC | PR | Foreigner | Entity
    existing_property_count: int
    renovation_budget: float = 0.0
    agent_rate: float = 0.01


class TaxResponse(BaseModel):
    purchase_price: float
    bsd: float
    absd: float
    legal_fees: float
    agent_commission: float
    valuation_fee: float
    renovation_budget: float
    total_cash_outlay: float


class SSDRequest(BaseModel):
    purchase_price: float
    hold_years: float


class SSDResponse(BaseModel):
    ssd: float
    ssd_rate: float
    hold_years: float
```

- [ ] **Step 2: Create `backend/app/schemas/profile.py`**

```python
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
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/schemas/
git commit -m "feat: pydantic schemas for tax and affordability endpoints"
```

---

## Task 6: FastAPI Routers + App Entry

**Files:**
- Create: `backend/app/routers/tax.py`
- Create: `backend/app/routers/profile.py`
- Create: `backend/app/main.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_routers.py`

- [ ] **Step 1: Write failing router integration tests**

Create `backend/tests/conftest.py`:

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
```

Create `backend/tests/test_routers.py`:

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestTaxRouter:
    def test_upfront_cost_sc_first_property(self):
        response = client.post("/api/tax/upfront-cost", json={
            "purchase_price": 1_000_000,
            "citizenship": "SC",
            "existing_property_count": 0,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["bsd"] == 24_600.0
        assert data["absd"] == 0.0
        assert data["total_cash_outlay"] == 1_038_100.0

    def test_upfront_cost_foreigner_high_absd(self):
        response = client.post("/api/tax/upfront-cost", json={
            "purchase_price": 1_000_000,
            "citizenship": "Foreigner",
            "existing_property_count": 0,
        })
        assert response.status_code == 200
        assert response.json()["absd"] == 600_000.0

    def test_ssd_within_one_year(self):
        response = client.post("/api/tax/ssd", json={
            "purchase_price": 1_000_000,
            "hold_years": 0.5,
        })
        assert response.status_code == 200
        assert response.json()["ssd"] == 120_000.0

    def test_ssd_beyond_three_years_zero(self):
        response = client.post("/api/tax/ssd", json={
            "purchase_price": 1_000_000,
            "hold_years": 5.0,
        })
        assert response.status_code == 200
        assert response.json()["ssd"] == 0.0

    def test_missing_required_field_returns_422(self):
        response = client.post("/api/tax/upfront-cost", json={
            "purchase_price": 1_000_000,
        })
        assert response.status_code == 422


class TestProfileRouter:
    def test_affordability_feasible(self):
        response = client.post("/api/profile/affordability", json={
            "purchase_price": 1_000_000,
            "gross_monthly_income": 15_000,
            "loan_tenure_years": 30,
            "existing_loan_count": 0,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["is_feasible"] is True
        assert data["max_loan"] > 0
        assert data["min_cash_portion"] == 50_000.0

    def test_affordability_hdb_returns_msr(self):
        response = client.post("/api/profile/affordability", json={
            "purchase_price": 500_000,
            "gross_monthly_income": 8_000,
            "loan_tenure_years": 25,
            "existing_loan_count": 0,
            "is_hdb": True,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["msr_pct"] is not None

    def test_affordability_non_hdb_msr_is_null(self):
        response = client.post("/api/profile/affordability", json={
            "purchase_price": 1_000_000,
            "gross_monthly_income": 10_000,
            "loan_tenure_years": 30,
            "existing_loan_count": 0,
            "is_hdb": False,
        })
        assert response.status_code == 200
        assert response.json()["msr_pct"] is None
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
pytest tests/test_routers.py -v
```

Expected: `ImportError` — `app.main` not found.

- [ ] **Step 3: Create `backend/app/routers/tax.py`**

```python
from fastapi import APIRouter
from app.schemas.tax import TaxRequest, TaxResponse, SSDRequest, SSDResponse
from app.services.tax import calculate_upfront_cost, calculate_ssd

router = APIRouter(prefix="/api/tax", tags=["tax"])


@router.post("/upfront-cost", response_model=TaxResponse)
def upfront_cost(req: TaxRequest) -> TaxResponse:
    result = calculate_upfront_cost(
        price=req.purchase_price,
        citizenship=req.citizenship,
        property_count=req.existing_property_count,
        renovation_budget=req.renovation_budget,
        agent_rate=req.agent_rate,
    )
    return TaxResponse(**result)


@router.post("/ssd", response_model=SSDResponse)
def seller_stamp_duty(req: SSDRequest) -> SSDResponse:
    ssd = calculate_ssd(req.purchase_price, req.hold_years)
    rate = ssd / req.purchase_price if req.purchase_price > 0 else 0.0
    return SSDResponse(ssd=ssd, ssd_rate=round(rate, 4), hold_years=req.hold_years)
```

- [ ] **Step 4: Create `backend/app/routers/profile.py`**

```python
from fastapi import APIRouter
from app.schemas.profile import AffordabilityRequest, AffordabilityResponse
from app.services.affordability import (
    calculate_max_loan,
    calculate_tdsr,
    calculate_msr,
    _monthly_payment,
)

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.post("/affordability", response_model=AffordabilityResponse)
def check_affordability(req: AffordabilityRequest) -> AffordabilityResponse:
    loan = calculate_max_loan(
        price=req.purchase_price,
        gross_monthly_income=req.gross_monthly_income,
        loan_count=req.existing_loan_count,
        loan_tenure_years=req.loan_tenure_years,
        existing_monthly_commitments=req.existing_monthly_commitments,
        is_hdb=req.is_hdb,
    )
    est_payment = _monthly_payment(loan["max_loan"], 0.04, req.loan_tenure_years)
    tdsr = calculate_tdsr(req.gross_monthly_income, est_payment, req.existing_monthly_commitments)
    msr = calculate_msr(req.gross_monthly_income, est_payment) if req.is_hdb else None

    return AffordabilityResponse(
        **loan,
        tdsr_ratio=tdsr["tdsr_ratio"],
        tdsr_pct=tdsr["tdsr_pct"],
        tdsr_passes=tdsr["passes"],
        msr_ratio=msr["msr_ratio"] if msr else None,
        msr_pct=msr["msr_pct"] if msr else None,
        msr_passes=msr["passes"] if msr else None,
    )
```

- [ ] **Step 5: Create `backend/app/main.py`**

```python
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.routers import tax, profile

app = FastAPI(title="PropSage API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tax.router)
app.include_router(profile.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
```

- [ ] **Step 6: Run all tests — verify they pass**

```bash
pytest tests/ -v
```

Expected: all tests PASS (including tax, affordability, and router tests).

- [ ] **Step 7: Start the server and manually verify**

```bash
uvicorn app.main:app --reload
```

Open `http://localhost:8000/docs` — should show the FastAPI Swagger UI with `/api/tax/upfront-cost`, `/api/tax/ssd`, `/api/profile/affordability`, `/health`.

- [ ] **Step 8: Commit**

```bash
git add backend/app/routers/ backend/app/main.py backend/tests/conftest.py backend/tests/test_routers.py
git commit -m "feat: FastAPI app with tax and affordability routers"
```

---

## Task 7: Frontend Scaffold

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/index.html`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/index.css`
- Create: `frontend/src/App.tsx`

- [ ] **Step 1: Create `frontend/package.json`**

```json
{
  "name": "propsage-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "zustand": "^4.5.5"
  },
  "devDependencies": {
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.41",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.3",
    "vite": "^5.4.2"
  }
}
```

- [ ] **Step 2: Create `frontend/vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
})
```

- [ ] **Step 3: Create `frontend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create `frontend/tailwind.config.js`**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 5: Create `frontend/postcss.config.js`**

```javascript
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
```

- [ ] **Step 6: Create `frontend/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PropSage — Singapore Property Investment Agent</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create `frontend/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: Create `frontend/src/main.tsx`**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 9: Create placeholder `frontend/src/App.tsx`**

```typescript
export function App() {
  return <div className="text-white p-8">PropSage loading...</div>
}
```

- [ ] **Step 10: Install dependencies and verify dev server starts**

```bash
cd frontend
npm install
npm run dev
```

Expected: Vite starts on `http://localhost:5173`, browser shows "PropSage loading..." on dark background.

- [ ] **Step 11: Commit**

```bash
git add frontend/
git commit -m "chore: Vite + React + TypeScript + Tailwind frontend scaffold"
```

---

## Task 8: Zustand Profile Store + Types

**Files:**
- Create: `frontend/src/types/profile.ts`
- Create: `frontend/src/stores/profileStore.ts`

- [ ] **Step 1: Create `frontend/src/types/profile.ts`**

```typescript
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
```

- [ ] **Step 2: Create `frontend/src/stores/profileStore.ts`**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type InvestorProfile, DEFAULT_PROFILE } from '../types/profile'

interface ProfileStore {
  profile: InvestorProfile
  isComplete: boolean
  setProfile: (updates: Partial<InvestorProfile>) => void
  resetProfile: () => void
}

function checkComplete(p: InvestorProfile): boolean {
  return p.annualIncomeSgd > 0 && p.purchasePriceBudget > 0
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      isComplete: false,
      setProfile: (updates) =>
        set((state) => {
          const updated = { ...state.profile, ...updates }
          return { profile: updated, isComplete: checkComplete(updated) }
        }),
      resetProfile: () => set({ profile: DEFAULT_PROFILE, isComplete: false }),
    }),
    { name: 'propsage-profile' }
  )
)
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/ frontend/src/stores/
git commit -m "feat: Zustand investor profile store with localStorage persistence"
```

---

## Task 9: API Client + Tax API Module

**Files:**
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/tax.ts`
- Create: `frontend/src/api/profile.ts`

- [ ] **Step 1: Create `frontend/src/api/client.ts`**

```typescript
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}
```

- [ ] **Step 2: Create `frontend/src/api/tax.ts`**

```typescript
import { apiPost } from './client'

export interface TaxRequest {
  purchase_price: number
  citizenship: string
  existing_property_count: number
  renovation_budget?: number
  agent_rate?: number
}

export interface TaxResponse {
  purchase_price: number
  bsd: number
  absd: number
  legal_fees: number
  agent_commission: number
  valuation_fee: number
  renovation_budget: number
  total_cash_outlay: number
}

export interface SSDRequest {
  purchase_price: number
  hold_years: number
}

export interface SSDResponse {
  ssd: number
  ssd_rate: number
  hold_years: number
}

export const calculateUpfrontCost = (req: TaxRequest) =>
  apiPost<TaxResponse>('/api/tax/upfront-cost', req)

export const calculateSsd = (req: SSDRequest) =>
  apiPost<SSDResponse>('/api/tax/ssd', req)
```

- [ ] **Step 3: Create `frontend/src/api/profile.ts`**

```typescript
import { apiPost } from './client'

export interface AffordabilityRequest {
  purchase_price: number
  gross_monthly_income: number
  existing_monthly_commitments?: number
  loan_tenure_years?: number
  existing_loan_count?: number
  is_hdb?: boolean
}

export interface AffordabilityResponse {
  max_loan: number
  min_down_payment: number
  min_cash_portion: number
  ltv_limit: number
  is_feasible: boolean
  tdsr_ratio: number
  tdsr_pct: number
  tdsr_passes: boolean
  msr_ratio: number | null
  msr_pct: number | null
  msr_passes: boolean | null
}

export const checkAffordability = (req: AffordabilityRequest) =>
  apiPost<AffordabilityResponse>('/api/profile/affordability', req)
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/api/
git commit -m "feat: frontend API client and tax/profile API modules"
```

---

## Task 10: App Shell + Sidebar Layout

**Files:**
- Create: `frontend/src/components/layout/Sidebar.tsx`
- Create: `frontend/src/components/layout/AppShell.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create `frontend/src/components/layout/Sidebar.tsx`**

```typescript
import { NavLink } from 'react-router-dom'

const NAV_SECTIONS = [
  {
    label: 'Core',
    items: [
      { path: '/calculator', icon: '🧮', label: 'Tax Calculator' },
      { path: '/profile', icon: '👤', label: 'My Profile' },
    ],
  },
  {
    label: 'Research',
    items: [
      { path: '/map', icon: '🗺️', label: 'District Map' },
      { path: '/transactions', icon: '📋', label: 'Transactions' },
      { path: '/market', icon: '📈', label: 'Market Intel' },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { path: '/loans', icon: '🏦', label: 'Loan Compare' },
      { path: '/roi', icon: '💹', label: 'ROI Projector' },
      { path: '/enbloc', icon: '🏚️', label: 'En-Bloc Watch' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { path: '/shortlist', icon: '📌', label: 'Shortlist' },
      { path: '/advisor', icon: '🤖', label: 'AI Advisor' },
    ],
  },
]

export function Sidebar() {
  return (
    <aside className="w-48 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div className="p-4 border-b border-gray-800">
        <span className="text-blue-400 font-bold text-lg">🏠 PropSage</span>
        <p className="text-gray-500 text-xs mt-0.5">SG Property Advisor</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-3">
            <p className="px-4 py-1 text-xs text-gray-600 uppercase tracking-wider">
              {section.label}
            </p>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-900/40 text-blue-400 border-l-2 border-blue-400'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800 border-l-2 border-transparent'
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 2: Create `frontend/src/components/layout/AppShell.tsx`**

```typescript
import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Update `frontend/src/App.tsx`**

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ProfilePage } from './pages/ProfilePage'
import { CalculatorPage } from './pages/CalculatorPage'

function ComingSoon({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500 text-lg">{name} — coming in a later phase</p>
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/calculator" replace />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/map" element={<ComingSoon name="District Map" />} />
          <Route path="/transactions" element={<ComingSoon name="Transaction Search" />} />
          <Route path="/market" element={<ComingSoon name="Market Intelligence" />} />
          <Route path="/loans" element={<ComingSoon name="Loan Comparison" />} />
          <Route path="/roi" element={<ComingSoon name="ROI Projector" />} />
          <Route path="/enbloc" element={<ComingSoon name="En-Bloc Watch" />} />
          <Route path="/shortlist" element={<ComingSoon name="Property Shortlist" />} />
          <Route path="/advisor" element={<ComingSoon name="AI Advisor" />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
```

- [ ] **Step 4: Verify dev server shows sidebar with all nav items**

```bash
cd frontend && npm run dev
```

Open `http://localhost:5173` — should redirect to `/calculator`, show the dark sidebar with all 11 navigation items grouped into Core / Research / Analysis / Tools. Clicking links navigates and shows "coming in a later phase" for unbuilt pages.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ frontend/src/App.tsx
git commit -m "feat: app shell layout with sidebar navigation"
```

---

## Task 11: Investor Profile Page

**Files:**
- Create: `frontend/src/pages/ProfilePage.tsx`

- [ ] **Step 1: Create `frontend/src/pages/ProfilePage.tsx`**

```typescript
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
```

- [ ] **Step 2: Verify in browser**

With both servers running, navigate to `http://localhost:5173/profile`. Check:
- All fields render and accept input
- Risk Profile buttons toggle selection (one at a time)
- Investment Goals toggle on/off (multi-select)
- Status bar shows yellow warning until income + budget filled, then green
- Refresh the page — profile data persists (Zustand localStorage)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/ProfilePage.tsx
git commit -m "feat: investor profile page with Zustand persistence"
```

---

## Task 12: Tax Calculator Page

**Files:**
- Create: `frontend/src/pages/CalculatorPage.tsx`

- [ ] **Step 1: Create `frontend/src/pages/CalculatorPage.tsx`**

```typescript
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

function formatPct(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`
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
```

- [ ] **Step 2: Verify in browser**

With both servers running (`uvicorn` + `npm run dev`), navigate to `http://localhost:5173/calculator`. Check:
- Default price pre-fills from profile budget
- Clicking Calculate shows three result cards: cost breakdown, SSD, affordability
- ABSD row shows yellow highlight when ABSD > 0 (change profile to PR or Foreigner to test)
- SSD shows warning if hold < 3 years, green tick if ≥ 3 years
- Affordability TDSR shows fail in red if income is low relative to price
- If backend is not running, shows clear error message

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/CalculatorPage.tsx
git commit -m "feat: tax calculator page with upfront cost, SSD, and affordability check"
```

---

## Task 13: Phase 1 Smoke Test

- [ ] **Step 1: Run all backend tests**

```bash
cd backend
pytest tests/ -v
```

Expected: all tests PASS. Count should be 30+.

- [ ] **Step 2: Start both servers**

Terminal 1:
```bash
cd backend && uvicorn app.main:app --reload
```

Terminal 2:
```bash
cd frontend && npm run dev
```

- [ ] **Step 3: End-to-end checklist**

Open `http://localhost:5173`:

- [ ] Redirects to `/calculator`
- [ ] Sidebar shows all nav sections
- [ ] Navigate to `/profile` — fill in citizenship=PR, income=120000, CPF=80000, budget=1500000
- [ ] Status bar turns green after filling income + budget
- [ ] Refresh page — profile data persists
- [ ] Navigate to `/calculator` — price pre-fills from profile budget
- [ ] Click Calculate — three result cards appear
- [ ] ABSD shows 75,000 (PR, 1st property, 5% of 1.5M)
- [ ] Change hold period to 2 — SSD shows 8%
- [ ] Change hold period to 5 — SSD shows 0%, green tick
- [ ] Navigate to `/map` — shows "coming in a later phase"

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: Phase 1 complete — tax engine, investor profile, calculator UI"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ BSD/ABSD/SSD calculation (§2)
- ✅ Upfront cost summary (§2)
- ✅ TDSR/MSR/LTV checks (§2)
- ✅ Investor profile fields — all 8 fields from spec §1 (citizenship, property count, income, CPF, loan commitments, property type, budget, horizon)
- ✅ Investment goals multi-select (§1)
- ✅ Risk profile (§1)
- ✅ `.env` config with all keys (§4 of design)
- ✅ `USE_MOCK_DATA` flag (§4 of design) — present in `.env.example`, ready for Phase 2
- ✅ App shell + sidebar navigation (§6 of design)
- ✅ All 11 routes registered (Phase 2–5 routes show "coming soon")

**Type consistency:**
- `_monthly_payment` defined in `affordability.py` and imported in `routers/profile.py` — consistent
- `InvestorProfile.existingMonthlyLoanCommitments` used in `ProfilePage.tsx` and passed to `AffordabilityRequest.existing_monthly_commitments` — consistent
- `TaxResponse` fields in `tax.py` service dict match `TaxResponse` Pydantic model — consistent
