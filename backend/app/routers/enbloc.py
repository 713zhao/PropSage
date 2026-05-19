from fastapi import APIRouter
from app.schemas.enbloc import DevelopmentProfile
from app.services.enbloc import get_all_developments

router = APIRouter(prefix="/api/enbloc", tags=["enbloc"])


@router.get("/developments", response_model=list[DevelopmentProfile])
def list_developments() -> list[DevelopmentProfile]:
    return [DevelopmentProfile(**d) for d in get_all_developments()]
