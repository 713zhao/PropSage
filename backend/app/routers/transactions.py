from fastapi import APIRouter
from app.services.ura import URAService
from app.schemas.transaction import (
    TransactionRecord,
    TransactionSearchRequest,
    CompsRequest,
)

router = APIRouter(prefix="/api/transactions", tags=["transactions"])
_svc = URAService()


@router.post("/search", response_model=list[TransactionRecord])
def search_transactions(req: TransactionSearchRequest) -> list[dict]:
    return _svc.search(
        district=req.district,
        property_type=req.property_type,
        min_price=req.min_price,
        max_price=req.max_price,
        min_psf=req.min_psf,
        max_psf=req.max_psf,
        limit=req.limit,
    )


@router.post("/comps", response_model=list[TransactionRecord])
def get_comps(req: CompsRequest) -> list[dict]:
    return _svc.get_comps(
        district=req.district,
        area_sqft=req.area_sqft,
        tolerance_pct=req.tolerance_pct,
    )
