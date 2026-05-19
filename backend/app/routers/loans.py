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
