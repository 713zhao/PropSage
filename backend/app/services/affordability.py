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
