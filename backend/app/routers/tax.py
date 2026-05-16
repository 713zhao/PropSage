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
