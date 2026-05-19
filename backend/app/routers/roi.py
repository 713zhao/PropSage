from fastapi import APIRouter
from app.schemas.roi import ROIRequest, ROIResponse
from app.services.roi import calculate_roi

router = APIRouter(prefix="/api/roi", tags=["roi"])


@router.post("/calculate", response_model=ROIResponse)
def roi_calculate(req: ROIRequest) -> ROIResponse:
    return calculate_roi(req)
