from fastapi import APIRouter
from app.schemas.profile import AffordabilityRequest, AffordabilityResponse
from app.services.affordability import (
    calculate_max_loan,
    calculate_tdsr,
    calculate_msr,
    monthly_payment,
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
    est_payment = monthly_payment(loan["max_loan"], 0.04, req.loan_tenure_years)
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
