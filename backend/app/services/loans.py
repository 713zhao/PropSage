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
