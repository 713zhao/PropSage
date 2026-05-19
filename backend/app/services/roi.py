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
    result = mid * 100
    rounded = round(result, 2)
    # Preserve sign for near-zero values (avoid -0.0 == 0.0 comparison issues)
    if rounded == 0.0 and result != 0.0:
        return result
    return rounded


def _compute_roi(req: ROIRequest, appreciation_pct: float, rental_multiplier: float) -> ROIResponse:
    down_payment = req.purchase_price - req.loan_amount
    annual_rate_dec = req.annual_rate_pct / 100.0
    monthly_installment = (
        monthly_payment(req.loan_amount, annual_rate_dec, req.tenure_years)
        if req.loan_amount > 0
        else 0.0
    )
    annual_mortgage = monthly_installment * 12

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
